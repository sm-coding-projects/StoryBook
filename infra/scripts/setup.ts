import { execSync } from 'child_process';

async function setup() {
  console.log('🔧 Setting up local development environment...\n');

  // 1. Start Supabase
  console.log('📦 Starting Supabase...');
  try {
    execSync('npx supabase start', { cwd: process.cwd(), stdio: 'inherit' });
  } catch {
    console.log('Supabase may already be running, continuing...');
  }

  // 2. Start MinIO and worker via docker-compose
  console.log('\n📦 Starting MinIO and Worker...');
  try {
    execSync('docker compose up -d', {
      cwd: `${process.cwd()}/infra/local`,
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('Failed to start Docker services:', err);
  }

  // 3. Create MinIO buckets
  console.log('\n🪣 Creating S3 buckets...');
  await createMinioBuckets();

  // 4. Apply migrations
  console.log('\n📄 Applying database migrations...');
  try {
    execSync('npx supabase db push --local', { stdio: 'inherit' });
  } catch {
    console.log('Migrations may already be applied');
  }

  console.log('\n✅ Setup complete!\n');
  console.log('Local services:');
  console.log('  Supabase Studio: http://localhost:54323');
  console.log('  Supabase API:    http://localhost:54321');
  console.log('  MinIO Console:   http://localhost:9001');
  console.log('  MinIO S3 API:    http://localhost:9000');
  console.log('  Next.js App:     http://localhost:3000');
}

async function createMinioBuckets() {
  const { S3Client, CreateBucketCommand, HeadBucketCommand } = await import('@aws-sdk/client-s3');

  const client = new S3Client({
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
    },
    forcePathStyle: true,
  });

  const buckets = ['gallery-originals', 'gallery-derivatives', 'gallery-exports'];

  for (const bucket of buckets) {
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      console.log(`  Bucket "${bucket}" already exists`);
    } catch {
      try {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
        console.log(`  Created bucket "${bucket}"`);
      } catch (err) {
        console.error(`  Failed to create bucket "${bucket}":`, err);
      }
    }
  }
}

setup().catch(console.error);
