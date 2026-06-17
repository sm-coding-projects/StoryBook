// One-shot demo seeder. Dependency-free (global fetch + node:crypto/zlib)
// mirror of infra/scripts/seed.ts so it can run in a bare node:20-alpine
// container. Idempotent: safe to run on every `docker compose up`.
//
// Demo photos are real: gradient PNGs are generated here, uploaded to MinIO
// with hand-rolled S3 SigV4, and processed by the worker into derivatives.

import crypto from 'node:crypto';
import zlib from 'node:zlib';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://gateway:8000';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://minio:9000';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || 'minioadmin';
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || 'minioadmin';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const BUCKET_ORIGINALS = process.env.S3_BUCKET || 'gallery-originals';
if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(url, label) {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return;
    } catch {}
    if (i === 0) console.log(`[seed] Waiting for ${label}...`);
    await sleep(2000);
  }
  throw new Error(`${label} not reachable at ${url}`);
}

async function rest(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, Prefer: 'return=representation', ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function ensureUser(email, password, user_metadata) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata }),
  });
  if (res.ok) {
    const user = await res.json();
    console.log(`[seed] Created user ${email}`);
    return user.id;
  }
  const list = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, { headers });
  if (!list.ok) throw new Error(`admin list users -> ${list.status}`);
  const { users } = await list.json();
  const existing = users.find((u) => u.email === email);
  if (!existing) throw new Error(`Could not create or find user ${email}: ${await res.text()}`);
  console.log(`[seed] User ${email} already exists`);
  return existing.id;
}

// ---------- Minimal PNG encoder (truecolor RGB, no deps) ----------

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Render a diagonal two-color gradient PNG with a few light bands. */
function gradientPng(width, height, [r1, g1, b1], [r2, g2, b2]) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  let off = 0;
  for (let y = 0; y < height; y++) {
    raw[off++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const t = (x / width + y / height) / 2;
      const band = Math.sin((y / height) * Math.PI * 6) * 12;
      raw[off++] = Math.max(0, Math.min(255, r1 + (r2 - r1) * t + band));
      raw[off++] = Math.max(0, Math.min(255, g1 + (g2 - g1) * t + band));
      raw[off++] = Math.max(0, Math.min(255, b1 + (b2 - b1) * t + band));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: truecolor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Minimal S3 SigV4 PUT (path-style, no deps) ----------

const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
const sha256hex = (data) => crypto.createHash('sha256').update(data).digest('hex');

async function s3Put(bucket, key, body) {
  const url = new URL(`${S3_ENDPOINT}/${bucket}/${key}`);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256hex(body);
  const canonicalUri = url.pathname.split('/').map(encodeURIComponent).join('/');

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
    '',
    'host;x-amz-content-sha256;x-amz-date',
    payloadHash,
  ].join('\n');

  const scope = `${date}/${S3_REGION}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n');
  const kSigning = hmac(hmac(hmac(hmac(`AWS4${S3_SECRET_KEY}`, date), S3_REGION), 's3'), 'aws4_request');
  const signature = hmac(kSigning, stringToSign).toString('hex');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: `AWS4-HMAC-SHA256 Credential=${S3_ACCESS_KEY}/${scope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`S3 PUT ${bucket}/${key} -> ${res.status}: ${await res.text()}`);
}

async function enqueueWithRetry(jobName, jobData) {
  // The worker creates the pg-boss queue partitions shortly after boot;
  // retry briefly in case seeding wins the race on first start.
  for (let i = 0; i < 15; i++) {
    try {
      await rest('POST', 'rpc/insert_pgboss_job', { job_name: jobName, job_data: jobData });
      return;
    } catch (err) {
      if (i === 14) throw err;
      await sleep(2000);
    }
  }
}

// ---------- Seed ----------

const DEMO_PHOTOS = [
  { name: 'demo-1', width: 1080, height: 1620, from: [38, 38, 48], to: [196, 164, 132] },
  { name: 'demo-2', width: 1080, height: 720, from: [225, 218, 209], to: [96, 84, 76] },
  { name: 'demo-3', width: 1080, height: 1620, from: [52, 61, 59], to: [173, 196, 190] },
  { name: 'demo-4', width: 1080, height: 720, from: [24, 24, 28], to: [142, 110, 162] },
];

async function ensureDemoPhoto(galleryId, ownerId, spec, sortOrder) {
  const key = `${galleryId}/originals/${spec.name}.png`;
  const existing = await rest(
    'GET',
    `photos?select=id,status,web_key&original_key=eq.${encodeURIComponent(key)}`
  );
  let photo = existing[0];

  if (photo?.status === 'ready' && photo.web_key) {
    console.log(`[seed] Photo ${spec.name} already processed`);
    return;
  }

  console.log(`[seed] Generating + uploading ${spec.name} (${spec.width}x${spec.height})`);
  const png = gradientPng(spec.width, spec.height, spec.from, spec.to);
  await s3Put(BUCKET_ORIGINALS, key, png);

  if (!photo) {
    [photo] = await rest('POST', 'photos', {
      gallery_id: galleryId,
      owner_id: ownerId,
      original_key: key,
      status: 'uploaded',
      sort_order: sortOrder,
      metadata: { width: spec.width, height: spec.height, file_size: png.length },
    });
  } else {
    await rest('PATCH', `photos?id=eq.${photo.id}`, { status: 'uploaded' });
  }

  await enqueueWithRetry('process-photo', { photoId: photo.id });
}

async function main() {
  await waitFor(`${SUPABASE_URL}/auth/v1/health`, 'GoTrue');
  await waitFor(`${SUPABASE_URL}/rest/v1/profiles?select=user_id&limit=1`, 'PostgREST');

  const photographerId = await ensureUser('photographer@demo.com', 'password123', {
    role: 'photographer',
    studio_name: 'Demo Studio',
  });
  const clientId = await ensureUser('client@demo.com', 'password123', { role: 'client' });

  const upsert = { Prefer: 'return=representation,resolution=merge-duplicates' };
  await rest('POST', 'profiles?on_conflict=user_id', {
    user_id: photographerId,
    role: 'photographer',
    studio_name: 'Demo Studio',
  }, upsert);
  await rest('POST', 'profiles?on_conflict=user_id', { user_id: clientId, role: 'client' }, upsert);

  const title = 'Miller & Sons Wedding';
  const existing = await rest('GET', `galleries?select=id&title=eq.${encodeURIComponent(title)}`);
  let galleryId = existing[0]?.id;

  if (!galleryId) {
    const [gallery] = await rest('POST', 'galleries', {
      owner_id: photographerId,
      title,
      status: 'published',
      settings: {
        privacy: 'invite_only',
        allowDownloads: true,
        watermarked: false,
        proofingEnabled: true,
      },
    });
    galleryId = gallery.id;
    console.log(`[seed] Created gallery "${title}" (${galleryId})`);
  } else {
    console.log(`[seed] Gallery "${title}" already exists`);
  }

  // Drop legacy placeholder rows (jpg keys from the old seeder, never uploaded)
  await rest('DELETE', `photos?gallery_id=eq.${galleryId}&original_key=like.${encodeURIComponent('*originals/demo-*.jpg')}`);

  for (let i = 0; i < DEMO_PHOTOS.length; i++) {
    await ensureDemoPhoto(galleryId, photographerId, DEMO_PHOTOS[i], i);
  }

  const membership = await rest(
    'GET',
    `gallery_memberships?select=id&gallery_id=eq.${galleryId}&client_user_id=eq.${clientId}`
  );
  if (!membership.length) {
    await rest('POST', 'gallery_memberships', { gallery_id: galleryId, client_user_id: clientId });
    console.log('[seed] Added client membership');
  }

  // Record an accepted invitation so the client appears in Contacts
  const invitation = await rest(
    'GET',
    `invitations?select=id&gallery_id=eq.${galleryId}&email=eq.${encodeURIComponent('client@demo.com')}`
  );
  if (!invitation.length) {
    await rest('POST', 'invitations', {
      gallery_id: galleryId,
      email: 'client@demo.com',
      token_hash: crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex'),
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 86400_000).toISOString(),
    });
    console.log('[seed] Recorded accepted invitation for contacts');
  }

  console.log('\n[seed] Done. Demo accounts:');
  console.log('  Photographer: photographer@demo.com / password123');
  console.log('  Client:       client@demo.com / password123');
}

main().catch((err) => {
  console.error('[seed] Failed:', err.message);
  process.exit(1);
});
