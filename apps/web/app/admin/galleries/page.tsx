import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GalleriesView } from './GalleriesView';

export default async function GalleriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: galleries } = await supabase
    .from('galleries')
    .select(`
      *,
      photos:photos!photos_gallery_id_fkey(id, thumb_key, web_key, original_key, status, metadata)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Get favorite counts per gallery
  const galleryIds = (galleries || []).map((g: { id: string }) => g.id);
  const { data: favCounts } = await supabase
    .from('proof_favorites')
    .select('gallery_id')
    .in('gallery_id', galleryIds.length > 0 ? galleryIds : ['__none__']);

  const favCountMap: Record<string, number> = {};
  (favCounts || []).forEach((f: { gallery_id: string }) => {
    favCountMap[f.gallery_id] = (favCountMap[f.gallery_id] || 0) + 1;
  });

  const enrichedGalleries = (galleries || []).map((g: { id: string; title: string; status: string; created_at: string; photos?: { thumb_key: string | null; web_key: string | null; status: string }[] }) => {
    const cover = g.photos?.find((p) => p.status === 'ready' && p.thumb_key);
    return {
      id: g.id,
      title: g.title,
      status: g.status,
      created_at: g.created_at,
      photos: g.photos,
      photoCount: g.photos?.length || 0,
      favoriteCount: favCountMap[g.id] || 0,
      coverImage: cover?.thumb_key
        ? `/api/signed-urls?key=${encodeURIComponent(cover.thumb_key)}`
        : null,
    };
  });

  return <GalleriesView galleries={enrichedGalleries} />;
}
