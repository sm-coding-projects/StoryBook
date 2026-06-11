'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Honor an explicit redirect (e.g. invite links) before role routing
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    if (redirect && redirect.startsWith('/')) {
      router.push(redirect);
      return;
    }

    // Check user role to redirect appropriately
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single();

    if (profile?.role === 'client') {
      router.push('/gallery');
    } else {
      router.push('/admin/galleries');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FDFDFD] text-[#1A1A1A] flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md px-8">
        <div className="mb-12 text-center">
          <Link href="/" className="text-xl font-bold tracking-[-0.04em] uppercase">
            StoryBook
          </Link>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#999]">
            Secure Access
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white px-8 py-4 rounded-none flex items-center justify-center gap-2 hover:bg-black/90 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            <LogIn size={14} />
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#999]">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-black hover:opacity-70 transition-opacity">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
