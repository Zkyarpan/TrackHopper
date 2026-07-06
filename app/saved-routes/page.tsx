"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import AuthModal from "@/components/AuthModal";
import AppHeader from "@/components/AppHeader";
import { createClient } from "@/lib/supabase/client";

interface SavedRoute {
  id: string;
  from_station_id: string;
  from_station_name: string;
  to_station_id: string;
  to_station_name: string;
  nickname: string | null;
  created_at: string;
}

export default function SavedRoutesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Load saved routes when user is available
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchRoutes();
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchRoutes() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("saved_routes")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      setRoutes(data ?? []);
    }
  }

  async function deleteRoute(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("saved_routes")
      .delete()
      .eq("id", id);
    setDeletingId(null);
    if (dbError) {
      setError(dbError.message);
    } else {
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function rerunRoute(route: SavedRoute) {
    // Navigate to home with query params — the home page's structured form
    // picks these up to pre-populate and trigger the journey search.
    const params = new URLSearchParams({
      fromId: route.from_station_id,
      fromName: route.from_station_name,
      toId: route.to_station_id,
      toName: route.to_station_name,
    });
    router.push(`/?${params}`);
  }

  // Not logged in
  if (!authLoading && !user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-gray-600">Sign in to view your saved routes.</p>
          <button
            type="button"
            onClick={() => setShowAuth(true)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Sign in
          </button>
          {showAuth && (
            <AuthModal
              onSuccess={() => setShowAuth(false)}
              onClose={() => setShowAuth(false)}
            />
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Saved routes</h1>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Plan a journey
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse h-16"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load saved routes: {error}
          </div>
        )}

        {!loading && routes.length === 0 && !error && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
            <p>No saved routes yet.</p>
            <p className="mt-1 text-gray-400">
              Plan a journey and click "Save route" to add one.
            </p>
          </div>
        )}

        {!loading && routes.length > 0 && (
          <ul className="space-y-3">
            {routes.map((route) => (
              <li
                key={route.id}
                className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {route.nickname ?? `${route.from_station_name} → ${route.to_station_name}`}
                  </p>
                  {route.nickname && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {route.from_station_name} → {route.to_station_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => rerunRoute(route)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    Plan again
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRoute(route.id)}
                    disabled={deletingId === route.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === route.id ? "…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

