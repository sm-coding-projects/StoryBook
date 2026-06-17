import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function seed() {
  console.log('🌱 Seeding database...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create demo photographer
  console.log('Creating demo photographer...');
  const { data: photographer, error: pError } = await supabase.auth.admin.createUser({
    email: 'photographer@demo.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { role: 'photographer', studio_name: 'Demo Studio' },
  });

  if (pError && !pError.message.includes('already')) {
    console.error('Failed to create photographer:', pError.message);
  } else {
    console.log(`  Photographer: photographer@demo.com / password123`);
  }

  // Create demo client
  console.log('Creating demo client...');
  const { data: client, error: cError } = await supabase.auth.admin.createUser({
    email: 'client@demo.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { role: 'client' },
  });

  if (cError && !cError.message.includes('already')) {
    console.error('Failed to create client:', cError.message);
  } else {
    console.log(`  Client: client@demo.com / password123`);
  }

  const photographerId = photographer?.user?.id;
  const clientId = client?.user?.id;

  if (photographerId) {
    // Update profile
    await supabase
      .from('profiles')
      .upsert({ user_id: photographerId, role: 'photographer', studio_name: 'Demo Studio' });

    // Create demo gallery
    console.log('\nCreating demo gallery...');
    const { data: gallery } = await supabase
      .from('galleries')
      .insert({
        owner_id: photographerId,
        title: 'Miller & Sons Wedding',
        status: 'published',
        settings: {
          privacy: 'invite_only',
          allowDownloads: true,
          watermarked: false,
          proofingEnabled: true,
        },
      })
      .select()
      .single();

    if (gallery) {
      console.log(`  Gallery: "${gallery.title}" (${gallery.id})`);

      // Create demo photos (placeholder entries)
      const demoPhotos = [
        { alt: 'Portrait', width: 1080, height: 1620 },
        { alt: 'Rings', width: 1080, height: 720 },
        { alt: 'Dance', width: 1080, height: 1620 },
        { alt: 'Party', width: 1080, height: 720 },
      ];

      for (let i = 0; i < demoPhotos.length; i++) {
        const p = demoPhotos[i];
        await supabase.from('photos').insert({
          gallery_id: gallery.id,
          owner_id: photographerId,
          original_key: `${gallery.id}/originals/demo-${i + 1}.jpg`,
          status: 'ready',
          sort_order: i,
          metadata: { width: p.width, height: p.height },
        });
      }
      console.log(`  Created ${demoPhotos.length} demo photos`);

      // Add client membership if client was created
      if (clientId) {
        await supabase
          .from('profiles')
          .upsert({ user_id: clientId, role: 'client' });

        await supabase
          .from('gallery_memberships')
          .insert({
            gallery_id: gallery.id,
            client_user_id: clientId,
          });
        console.log('  Added client membership');
      }
    }
  }

  console.log('\n✅ Seeding complete!\n');
}

seed().catch(console.error);
