import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ContactsView } from './ContactsView';

export interface ContactRow {
  email: string;
  invites: {
    galleryId: string;
    galleryTitle: string;
    status: string;
    createdAt: string;
    acceptedAt: string | null;
  }[];
  firstInvitedAt: string;
  hasAccepted: boolean;
}

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // RLS limits invitations to galleries the photographer owns
  const { data: invitations } = await supabase
    .from('invitations')
    .select('email, status, created_at, accepted_at, gallery_id, galleries(title)')
    .order('created_at', { ascending: false });

  const byEmail = new Map<string, ContactRow>();
  for (const inv of invitations || []) {
    const email = inv.email.toLowerCase();
    const entry: ContactRow = byEmail.get(email) || {
      email,
      invites: [],
      firstInvitedAt: inv.created_at,
      hasAccepted: false,
    };
    entry.invites.push({
      galleryId: inv.gallery_id,
      galleryTitle: (inv.galleries as unknown as { title: string } | null)?.title || 'Untitled',
      status: inv.status,
      createdAt: inv.created_at,
      acceptedAt: inv.accepted_at,
    });
    if (inv.created_at < entry.firstInvitedAt) entry.firstInvitedAt = inv.created_at;
    if (inv.status === 'accepted') entry.hasAccepted = true;
    byEmail.set(email, entry);
  }

  return <ContactsView contacts={Array.from(byEmail.values())} />;
}
