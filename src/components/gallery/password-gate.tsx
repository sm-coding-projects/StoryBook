"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";

interface PasswordGateProps {
  galleryName: string;
  onVerify: (password: string) => Promise<boolean>;
}

export function PasswordGate({ galleryName, onVerify }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    const valid = await onVerify(password);
    if (!valid) {
      setError("Incorrect password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-neutral-500" />
          </div>
          <h1 className="text-2xl font-light tracking-tight text-neutral-900">
            {galleryName}
          </h1>
          <p className="text-sm text-neutral-500">
            This gallery is password protected.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-center"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "View Gallery"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
