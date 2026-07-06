"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import AuthModal from "@/components/AuthModal";

// Deterministic colour from a string — gives each user a consistent avatar colour
function avatarColor(str: string): string {
  const colours = [
    "bg-red-600",
    "bg-blue-600",
    "bg-green-600",
    "bg-purple-600",
    "bg-orange-500",
    "bg-teal-600",
    "bg-pink-600",
    "bg-indigo-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colours[Math.abs(hash) % colours.length];
}

type UserMeta = {
  email?: string | null;
  id?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
};

function avatarUrl(user: UserMeta): string | null {
  return user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
}

function initials(user: UserMeta): string {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  const email = user.email ?? "";
  return email.slice(0, 1).toUpperCase() || "?";
}

function displayName(user: UserMeta): string {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  if (name) return name.trim();
  const email = user.email ?? "";
  return email.split("@")[0] || email;
}

export default function AppHeader() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [dropdownOpen]);

  async function handleSignOut() {
    setDropdownOpen(false);
    await signOut();
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">TH</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-900 leading-none">TrackHopper</p>
              <p className="text-xs text-gray-500 mt-0.5">London journey planner</p>
            </div>
          </Link>

          {/* Right side — auth state */}
          <div className="shrink-0 flex items-center">
            {authLoading ? (
              // Skeleton — same size as the avatar so no layout shift
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              // ── Logged-in state: avatar + dropdown ──────────────────────
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50 transition-colors"
                  aria-label="Account menu"
                >
                  {/* Avatar — real photo if available, else initials */}
                  {avatarUrl(user) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl(user)!}
                      alt={displayName(user)}
                      className="w-8 h-8 rounded-full shrink-0 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${avatarColor(user.email ?? user.id ?? "")}`}
                    >
                      <span className="text-white font-bold text-xs">
                        {initials(user)}
                      </span>
                    </div>
                  )}
                  {/* Name — hidden on mobile */}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {displayName(user)}
                  </span>
                  {/* Chevron */}
                  <svg
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-gray-200 bg-white shadow-lg py-1 z-30">
                    {/* User info */}
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2.5">
                      {avatarUrl(user) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl(user)!}
                          alt={displayName(user)}
                          className="w-8 h-8 rounded-full shrink-0 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${avatarColor(user.email ?? user.id ?? "")}`}
                        >
                          <span className="text-white font-bold text-xs">
                            {initials(user)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {displayName(user)}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {/* Saved routes */}
                    <Link
                      href="/saved-routes"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Saved routes
                    </Link>
                    {/* Sign out */}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // ── Logged-out state: Sign in button ──────────────────────
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          onSuccess={() => setShowAuth(false)}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
