import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsView } from './SettingsView';

export interface GalleryUsage {
  galleryId: string;
  title: string;
  photoCount: number;
  bytes: number;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, studio_name, created_at')
    .eq('user_id', user.id)
    .single();

  // Storage usage: photos store file_size (bytes) in metadata at upload time
  const { data: galleries } = await supabase
    .from('galleries')
    .select('id, title, photos!photos_gallery_id_fkey(metadata)')
    .eq('owner_id', user.id);

  const usage: GalleryUsage[] = (galleries || []).map((g) => {
    const photos = (g.photos as { metadata: Record<string, unknown> | null }[] | null) || [];
    const bytes = photos.reduce(
      (sum, p) => sum + (Number(p.metadata?.file_size) || 0),
      0
    );
    return { galleryId: g.id, title: g.title, photoCount: photos.length, bytes };
  });

  return (
    <SettingsView
      email={user.email || ''}
      profile={profile || { role: 'photographer', studio_name: null, created_at: '' }}
      usage={usage}
    />
  );
}
