import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminShell } from './AdminShell';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Clients have no business in the studio admin — send them to their galleries
  if (profile?.role === 'client') {
    redirect('/gallery');
  }

  return (
    <AdminShell user={user} profile={profile}>
      {children}
    </AdminShell>
  );
}
