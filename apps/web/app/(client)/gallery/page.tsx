import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

export default async function ClientGalleriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/gallery');

  // RLS returns galleries the user owns or is a member of
  const { data: galleries } = await supabase
    .from('galleries')
    .select(`
      id, title, status,
      photos!photos_gallery_id_fkey(thumb_key, status)
    `)
    .order('created_at', { ascending: false });

  const items = (galleries || []).map((g) => {
    const cover = (g.photos as { thumb_key: string | null; status: string }[] | null)?.find(
      (p) => p.status === 'ready' && p.thumb_key
    );
    return {
      id: g.id,
      title: g.title,
      coverImage: cover?.thumb_key
        ? `/api/signed-urls?key=${encodeURIComponent(cover.thumb_key)}`
        : null,
    };
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-20">
            <span className="text-sm font-black tracking-[-0.04em] uppercase text-black">StoryBook</span>
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#999]">Your Galleries</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-light tracking-tight mb-12 uppercase text-center">Your Galleries</h1>

        {items.length === 0 ? (
          <p className="text-center py-24 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            No galleries yet — ask your photographer for an invite link
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {items.map((g) => (
              <Link key={g.id} href={`/gallery/${g.id}`} className="group block">
                <div className="aspect-[4/5] relative overflow-hidden bg-gray-100 mb-6">
                  {g.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.coverImage}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">No photos yet</span>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">{g.title}</h3>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
