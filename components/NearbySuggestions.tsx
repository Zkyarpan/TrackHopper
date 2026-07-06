"use client";

// NearbySuggestions — shown after the user grants location.
// Shows: up to 5 nearby TfL stations (tappable → set as "from")
// Plus: logged-in user's saved routes whose from_station is in the
//        nearby list → surfaced as a distinct "pick up where you left off" row.

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { StationMatch } from "@/lib/types";

interface NearbyStation extends StationMatch {
  distance?: number;
}

interface SavedRoute {
  id: string;
  from_station_id: string;
  from_station_name: string;
  to_station_id: string;
  to_station_name: string;
  nickname: string | null;
}

interface Props {
  lat: number;
  lon: number;
  onSelectFrom: (station: StationMatch) => void;
  onRunSavedRoute: (from: StationMatch, to: StationMatch) => void;
}

export default function NearbySuggestions({ lat, lon, onSelectFrom, onRunSavedRoute }: Props) {
  const { user } = useAuth();
  const [nearby, setNearby] = useState<NearbyStation[]>([]);
  const [savedMatches, setSavedMatches] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // 1. Fetch nearby stations
      try {
        const res = await fetch(`/api/stations/nearby?lat=${lat}&lon=${lon}&radius=800`);
        const data = await res.json();
        if (!cancelled) {
          setNearby((data.stops ?? []).slice(0, 5));
        }
      } catch {
        if (!cancelled) setError("Couldn't load nearby stations.");
        return;
      }

      // 2. If logged in, fetch saved routes and cross-reference
      if (user) {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("saved_routes")
            .select("id,from_station_id,from_station_name,to_station_id,to_station_name,nickname")
            .order("created_at", { ascending: false })
            .limit(20);

          if (!cancelled && data) {
            // Find saved routes whose from_station is in the nearby list
            setNearby((currentNearby) => {
              const nearbyIds = new Set(currentNearby.map((s) => s.id));
              const matches = (data as SavedRoute[]).filter((r) =>
                nearbyIds.has(r.from_station_id)
              );
              setSavedMatches(matches);
              return currentNearby;
            });
          }
        } catch { /* saved routes are optional — don't block */ }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [lat, lon, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2">
        <p className="text-xs font-medium text-gray-500">Nearby stations</p>
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || nearby.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-3">
      {/* Saved route quick-picks — only shown to logged-in users with matching routes */}
      {savedMatches.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Continue a saved route</p>
          <ul className="space-y-1">
            {savedMatches.slice(0, 3).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() =>
                    onRunSavedRoute(
                      { id: r.from_station_id, name: r.from_station_name, modes: [] },
                      { id: r.to_station_id, name: r.to_station_name, modes: [] }
                    )
                  }
                  className="w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-900 transition-colors"
                >
                  <svg className="h-4 w-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="truncate">
                    {r.nickname ?? `${r.from_station_name} → ${r.to_station_name}`}
                  </span>
                  <span className="ml-auto text-xs text-blue-400 shrink-0">Plan →</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nearby stations */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1.5">Nearby stations</p>
        <ul className="flex flex-wrap gap-1.5">
          {nearby.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelectFrom(s)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <span className="text-gray-400 capitalize">{s.modes[0] ?? "•"}</span>
                <span>{s.name}</span>
                {s.distance != null && (
                  <span className="text-gray-400">
                    {s.distance < 1000
                      ? `${Math.round(s.distance)}m`
                      : `${(s.distance / 1000).toFixed(1)}km`}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
