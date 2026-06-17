'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#999] hover:text-black transition-colors'
      }
    >
      <LogOut size={14} /> Log Out
    </button>
  );
}
