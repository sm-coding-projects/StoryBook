'use client';

import React, { useState } from 'react';
import { Settings, Download, Lock, ShieldCheck, Heart, X } from 'lucide-react';
import { motion } from 'motion/react';

interface GallerySettings {
  title: string;
  privacy: 'public' | 'unlisted' | 'password';
  password?: string;
  allowDownloads: boolean;
  watermarked: boolean;
  proofingEnabled: boolean;
}

interface CreateGalleryModalProps {
  onClose: () => void;
  onCreate: (settings: GallerySettings) => void;
}

export const CreateGalleryModal: React.FC<CreateGalleryModalProps> = ({ onClose, onCreate }) => {
  const [settings, setSettings] = useState<GallerySettings>({
    title: '',
    privacy: 'public',
    allowDownloads: true,
    watermarked: false,
    proofingEnabled: true,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-5 sm:px-8 sm:py-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-medium text-gray-900">Create New Gallery</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <section className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Gallery Title</span>
              <input
                type="text"
                placeholder="e.g. Sarah & James Wedding"
                className="mt-1 block w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black rounded-lg transition-all outline-none"
                value={settings.title}
                onChange={e => setSettings({...settings, title: e.target.value})}
              />
            </label>
          </section>

          {/* Privacy */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Lock size={16} /> Privacy Mode
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(['public', 'unlisted', 'password'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSettings({...settings, privacy: mode})}
                  className={`px-2 py-3 sm:px-4 rounded-xl border text-sm capitalize transition-all ${
                    settings.privacy === mode
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            {settings.privacy === 'password' && (
              <input
                type="password"
                placeholder="Enter password..."
                className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-black rounded-lg transition-all outline-none"
                onChange={e => setSettings({...settings, password: e.target.value})}
              />
            )}
          </section>

          {/* Feature Toggles */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Settings size={16} /> Gallery Features
            </h3>
            <div className="space-y-3">
              {[
                { id: 'allowDownloads', label: 'Allow Downloads', icon: <Download size={18} /> },
                { id: 'watermarked', label: 'Apply Watermarks', icon: <ShieldCheck size={18} /> },
                { id: 'proofingEnabled', label: 'Enable Proofing (Favorites/Comments)', icon: <Heart size={18} /> }
              ].map((feature) => (
                <label key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{feature.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                    checked={settings[feature.id as keyof GallerySettings] as boolean}
                    onChange={e => setSettings({...settings, [feature.id]: e.target.checked})}
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="px-5 py-5 sm:px-8 sm:py-6 bg-gray-50 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(settings)}
            disabled={!settings.title}
            className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            Create Gallery
          </button>
        </div>
      </motion.div>
    </div>
  );
};
