import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProofingView } from './ProofingView';

export default async function ProofingPage({
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
      photos!photos_gallery_id_fkey(*),
      proof_favorites(*),
      submissions(*)
    `)
    .eq('id', galleryId)
    .eq('owner_id', user.id)
    .single();

  if (error || !gallery) redirect('/admin/galleries');

  const { data: exports } = await supabase
    .from('exports')
    .select('id, type, status, zip_key, created_at')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: ratings } = await supabase
    .from('proof_ratings')
    .select('photo_id, rating')
    .eq('gallery_id', galleryId);

  const { data: comments } = await supabase
    .from('proof_comments')
    .select('id, photo_id, body, created_at')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: true });

  return (
    <ProofingView
      gallery={gallery}
      photos={gallery.photos || []}
      favorites={gallery.proof_favorites || []}
      submissions={gallery.submissions || []}
      exports={exports || []}
      ratings={ratings || []}
      comments={comments || []}
    />
  );
}
