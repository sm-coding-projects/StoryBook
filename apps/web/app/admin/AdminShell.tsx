'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Users, Settings2, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AdminShellProps {
  user: User;
  profile: { role: string; studio_name: string | null } | null;
  children: React.ReactNode;
}

export function AdminShell({ user, profile, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/admin/galleries', icon: Layout, label: 'Galleries' },
    { href: '/admin/contacts', icon: Users, label: 'Contacts' },
    { href: '/admin/settings', icon: Settings2, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-12">
            <div className="text-xl font-bold tracking-[-0.04em] uppercase">
              StoryBook
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-none text-xs uppercase tracking-widest transition-colors ${
                    isActive
                      ? 'bg-black text-white font-bold'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={16} /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-gray-100">
          {profile?.studio_name && (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
              {profile.studio_name}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-16">
        {children}
      </main>
    </div>
  );
}
