'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { acceptInvite } from '@/actions/gallery';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'checking' | 'accepting' | 'success' | 'error' | 'need-auth'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    async function process() {
      if (!token) {
        setStatus('error');
        setError('Missing invite token');
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatus('need-auth');
        return;
      }

      setStatus('accepting');
      try {
        const result = await acceptInvite(token);
        setStatus('success');
        setTimeout(() => router.push(`/gallery/${result.gallery_id}`), 2000);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      }
    }

    process();
  }, [token, router]);

  return (
    <>
      {status === 'checking' && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-gray-400" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Verifying invitation...
          </p>
        </div>
      )}

      {status === 'accepting' && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-black" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Accepting invitation...
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 size={32} className="text-green-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500">
            Invitation Accepted!
          </p>
          <p className="text-xs text-gray-400">Redirecting to gallery...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4">
          <XCircle size={32} className="text-red-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest"
          >
            Go Home
          </button>
        </div>
      )}

      {status === 'need-auth' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">
            Please sign in to accept this invitation
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/auth/login?redirect=/invite/accept?token=${token}`)}
              className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push(`/auth/signup?redirect=/invite/accept?token=${token}`)}
              className="px-6 py-3 bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl font-bold tracking-[-0.04em] uppercase mb-8">StoryBook</div>
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={32} className="animate-spin text-gray-400" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Loading...
              </p>
            </div>
          }
        >
          <AcceptInviteContent />
        </Suspense>
      </div>
    </div>
  );
}
