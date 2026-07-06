"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onSuccess?: () => void;
  onClose?: () => void;
  // Optional message shown above the form (e.g. "Sign in to save this route")
  prompt?: string;
}

export default function AuthModal({ onSuccess, onClose, prompt }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const supabase = createClient();

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // After signup Supabase sends a confirmation email; treat as success
        // so we can immediately try to save — Supabase session is created
        // even before email confirmation for new signups in most configs.
        onSuccess?.();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send link";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        {/* Close */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h2>
          {prompt && (
            <p className="mt-1 text-sm text-gray-500">{prompt}</p>
          )}
        </div>

        {magicSent ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Check your email — we sent a sign-in link to <strong>{email}</strong>
          </div>
        ) : (
          <>
            <form onSubmit={handleEmailPassword} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-3 flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Magic link */}
            <form onSubmit={handleMagicLink}>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Email me a sign-in link instead
              </button>
            </form>

            {/* Mode toggle */}
            <p className="mt-4 text-center text-xs text-gray-500">
              {mode === "signin" ? (
                <>
                  No account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("signup"); setError(null); }}
                    className="text-blue-600 underline"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have one?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("signin"); setError(null); }}
                    className="text-blue-600 underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
