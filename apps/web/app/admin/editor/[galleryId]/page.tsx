import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EditorView } from './EditorView';

export default async function EditorPage({
  params,
}: {
  params: Promise<{ galleryId: string }>;
}) {
  const { galleryId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: gallery, error } = await supabase
    .from('galleries')
    .select(`
      *,
      photos!photos_gallery_id_fkey(*)
    `)
    .eq('id', galleryId)
    .eq('owner_id', user.id)
    .single();

  if (error || !gallery) redirect('/admin/galleries');

  // Get invitations for this gallery
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false });

  return (
    <EditorView
      gallery={gallery}
      photos={gallery.photos || []}
      invitations={invitations || []}
    />
  );
}
