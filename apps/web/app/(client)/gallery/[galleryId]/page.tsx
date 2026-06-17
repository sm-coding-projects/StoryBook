import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClientGalleryView } from './ClientGalleryView';

export default async function ClientGalleryPage({
  params,
}: {
  params: Promise<{ galleryId: string }>;
}) {
  const { galleryId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/gallery/${galleryId}`);

  // Fetch gallery - RLS ensures only members or owners can see it
  const { data: gallery, error } = await supabase
    .from('galleries')
    .select(`
      *,
      photos!photos_gallery_id_fkey(*)
    `)
    .eq('id', galleryId)
    .single();

  if (error || !gallery) {
    redirect('/auth/login');
  }

  // Fetch client's favorites
  const { data: favorites } = await supabase
    .from('proof_favorites')
    .select('photo_id')
    .eq('gallery_id', galleryId)
    .eq('client_user_id', user.id);

  const favoriteIds = (favorites || []).map((f: { photo_id: string }) => f.photo_id);

  // Fetch client's ratings and comments for the proofing panel
  const { data: ratings } = await supabase
    .from('proof_ratings')
    .select('photo_id, rating')
    .eq('gallery_id', galleryId)
    .eq('client_user_id', user.id);

  const { data: comments } = await supabase
    .from('proof_comments')
    .select('id, photo_id, body, created_at')
    .eq('gallery_id', galleryId)
    .eq('client_user_id', user.id)
    .order('created_at', { ascending: true });

  // Check if already submitted
  const { data: submission } = await supabase
    .from('submissions')
    .select('id, locked')
    .eq('gallery_id', galleryId)
    .eq('client_user_id', user.id)
    .eq('locked', true)
    .single();

  // Check user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return (
    <ClientGalleryView
      gallery={gallery}
      photos={gallery.photos || []}
      favoriteIds={favoriteIds}
      ratings={ratings || []}
      comments={comments || []}
      isSubmitted={!!submission}
      isOwner={gallery.owner_id === user.id}
      userRole={profile?.role || 'client'}
    />
  );
}
