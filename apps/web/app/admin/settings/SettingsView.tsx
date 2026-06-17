'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, KeyRound, HardDrive, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateStudioName } from '@/actions/profile';
import type { GalleryUsage } from './page';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

interface SettingsViewProps {
  email: string;
  profile: { role: string; studio_name: string | null; created_at: string };
  usage: GalleryUsage[];
}

export function SettingsView({ email, profile, usage }: SettingsViewProps) {
  const router = useRouter();
  const [studioName, setStudioName] = useState(profile.studio_name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const totalBytes = usage.reduce((s, g) => s + g.bytes, 0);
  const totalPhotos = usage.reduce((s, g) => s + g.photoCount, 0);

  const handleSaveName = async () => {
    setSavingName(true);
    setNameMessage(null);
    try {
      await updateStudioName(studioName);
      setNameMessage({ ok: true, text: 'Studio name updated' });
      router.refresh();
    } catch (err) {
      setNameMessage({ ok: false, text: err instanceof Error ? err.message : 'Update failed' });
    }
    setSavingName(false);
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage({ ok: false, text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ ok: false, text: 'Passwords do not match' });
      return;
    }
    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMessage({ ok: false, text: error.message });
    } else {
      setPasswordMessage({ ok: true, text: 'Password updated' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end mb-8 sm:mb-16 border-b border-gray-200 pb-6 sm:pb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 uppercase">Settings</h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mt-2">Studio configuration</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 space-y-8 lg:space-y-12">
          {/* Studio profile */}
          <section className="bg-white p-6 sm:p-8 border border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Studio Profile</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                  Studio Name
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    placeholder="Your Studio Name"
                    className="w-full sm:flex-1 px-4 py-3 bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName || !studioName.trim()}
                    className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={14} /> {savingName ? '...' : 'Save'}
                  </button>
                </div>
                {nameMessage && (
                  <p className={`mt-2 text-[11px] font-bold ${nameMessage.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {nameMessage.text}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-bold text-gray-900 break-words">{email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Role</p>
                  <p className="text-sm font-bold text-gray-900 uppercase">{profile.role}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Password */}
          <section className="bg-white p-6 sm:p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <KeyRound size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Change Password</h3>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-black"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !newPassword}
                className="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                {savingPassword ? '...' : 'Update Password'}
              </button>
              {passwordMessage && (
                <p className={`text-[11px] font-bold ${passwordMessage.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordMessage.text}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Storage */}
        <div className="lg:col-span-5">
          <section className="bg-black text-white p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-8">
              <HardDrive size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Storage</h3>
            </div>
            <div className="mb-8">
              <p className="text-4xl font-bold">{formatBytes(totalBytes)}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-2">
                {totalPhotos} originals across {usage.length} {usage.length === 1 ? 'gallery' : 'galleries'}
              </p>
            </div>
            {usage.length > 0 && (
              <ul className="space-y-3 border-t border-white/10 pt-6">
                {usage.map((g) => (
                  <li key={g.galleryId} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0 font-bold uppercase tracking-widest text-white/70 truncate">{g.title}</span>
                    <span className="font-black text-white/50 whitespace-nowrap">
                      {g.photoCount} · {formatBytes(g.bytes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3">
              <CheckCircle2 size={14} className="text-green-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-white/50 leading-relaxed">
                Storage grows automatically with your library — there are no
                quotas in the app. Local volumes expand with available disk;
                S3-compatible object storage (R2/S3) scales without limits in
                production.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
