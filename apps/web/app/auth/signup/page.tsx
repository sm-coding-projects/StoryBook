'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Invited clients arrive with ?redirect=/invite/accept?... — sign them
    // up as clients, not photographers.
    const redirect = new URLSearchParams(window.location.search).get('redirect');
    const isInviteFlow = !!redirect?.startsWith('/invite/accept');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: isInviteFlow ? 'client' : 'photographer',
          studio_name: studioName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Update profile with studio name
    const { data: { user } } = await supabase.auth.getUser();
    if (user && studioName) {
      await supabase
        .from('profiles')
        .update({ studio_name: studioName })
        .eq('user_id', user.id);
    }

    if (redirect && redirect.startsWith('/')) {
      router.push(redirect);
      return;
    }
    router.push('/admin/galleries');
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

      <div className="relative z-10 w-full max-w-md px-5 sm:px-8">
        <div className="mb-12 text-center">
          <Link href="/" className="text-xl font-bold tracking-[-0.04em] uppercase">
            StoryBook
          </Link>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#999]">
            Create Your Studio
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
              Studio Name
            </label>
            <input
              type="text"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="w-full px-4 py-4 bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="Your Studio Name"
            />
          </div>

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
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white px-8 py-4 rounded-none flex items-center justify-center gap-2 hover:bg-black/90 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            <UserPlus size={14} />
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#999]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-black hover:opacity-70 transition-opacity">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
