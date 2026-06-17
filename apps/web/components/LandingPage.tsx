'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#FDFDFD] text-[#1A1A1A] overflow-hidden selection:bg-[#E5E5E5] selection:text-black">
      {/* Background Texture & Pattern */}
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

      {/* Noise Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-8 sm:py-10 max-w-[1440px] mx-auto">
        <div className="text-xl font-bold tracking-[-0.04em] uppercase">
          StoryBook
        </div>
        <div className="flex items-center gap-5 sm:gap-0 sm:space-x-12 text-[13px] font-medium tracking-wider uppercase">
          <Link
            href="/auth/login"
            className="flex items-center gap-2 text-[#666] hover:text-black transition-colors"
          >
            <LogIn size={14} /> Login
          </Link>
          <Link
            href="/auth/signup"
            className="flex items-center gap-2 text-black hover:opacity-70 transition-opacity"
          >
            <UserPlus size={14} /> Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-[1440px] mx-auto px-6 pt-12 pb-24 sm:px-8 sm:pt-24 sm:pb-40">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-[18vw] sm:text-[12vw] lg:text-[10vw] font-bold tracking-[-0.06em] leading-[0.85] mb-8 sm:mb-12 uppercase">
                Story<br />Book
              </h1>

              <div className="h-[1px] w-full bg-[#E5E5E5] mb-8 sm:mb-12" />

              <div className="max-w-xl">
                <p className="text-2xl lg:text-3xl font-light text-[#666] leading-snug tracking-tight mb-10 sm:mb-16">
                  A high-performance digital sanctuary for photographers to deliver, proof, and archive visual narratives.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  <Link
                    href="/auth/signup"
                    className="group flex items-center gap-4 bg-[#1A1A1A] text-white px-10 py-6 rounded-none hover:bg-black transition-all"
                  >
                    <span className="text-sm font-bold uppercase tracking-widest">Get Started</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#999] max-w-[180px]">
                    Optimized for professional workflows and client delivery.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="col-span-12 lg:col-span-4 mt-12 lg:mt-0 flex flex-col justify-end border-t lg:border-t-0 lg:border-l border-[#E5E5E5] pt-12 lg:pt-0 lg:pl-8">
            <div className="space-y-12">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#999] mb-4 block">01 / Proofing</span>
                <p className="text-sm text-[#444] leading-relaxed">Seamless client selection workflow with real-time feedback and locking mechanisms.</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#999] mb-4 block">02 / Delivery</span>
                <p className="text-sm text-[#444] leading-relaxed">High-resolution asset distribution with automated processing and storage optimization.</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#999] mb-4 block">03 / Archivist</span>
                <p className="text-sm text-[#444] leading-relaxed">A permanent, elegant home for every collection you&apos;ve ever captured.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Gradient Elements */}
      <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#F0F0F0] to-transparent blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-[#F5F5F5] to-transparent blur-3xl opacity-30 pointer-events-none" />

      {/* Footer Divider */}
      <footer className="relative z-10 border-t border-[#E5E5E5] py-8 px-6 sm:py-12 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#999]">
          <div>&copy; 2026 StoryBook Systems</div>
          <div className="flex gap-6 sm:gap-8">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
