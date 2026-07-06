"use client";

import { useState } from "react";
import type { Journey } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import AuthModal from "@/components/AuthModal";
import { createClient } from "@/lib/supabase/client";

const MODE_LABELS: Record<string, string> = {
  tube: "Tube",
  bus: "Bus",
  walking: "Walk",
  walk: "Walk",
  "elizabeth-line": "Elizabeth",
  overground: "Overground",
  dlr: "DLR",
  tram: "Tram",
  "national-rail": "Rail",
  cycle: "Cycle",
  "cycle-hire": "Cycle",
};

const MODE_COLOURS: Record<string, string> = {
  tube: "bg-red-600 text-white",
  bus: "bg-red-500 text-white",
  walking: "bg-green-600 text-white",
  walk: "bg-green-600 text-white",
  "elizabeth-line": "bg-purple-700 text-white",
  overground: "bg-orange-500 text-white",
  dlr: "bg-teal-600 text-white",
  tram: "bg-green-500 text-white",
  "national-rail": "bg-gray-700 text-white",
};

function modeBadge(mode: string) {
  const label = MODE_LABELS[mode] ?? mode;
  const colour = MODE_COLOURS[mode] ?? "bg-gray-500 text-white";
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${colour}`}
    >
      {label}
    </span>
  );
}

function formatTime(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function formatFare(fare: number | null) {
  if (fare === null) return null;
  return `£${fare.toFixed(2)}`;
}

interface SaveRoutePayload {
  fromStationId: string;
  fromStationName: string;
  toStationId: string;
  toStationName: string;
}

interface Props {
  journeys: Journey[];
  savePayload?: SaveRoutePayload; // from/to station info for saving
}

// ── Save button (per journey card) ──────────────────────────────────────────

function SaveButton({ payload }: { payload: SaveRoutePayload }) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doSave(nicknameVal: string) {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setError("Not signed in");
      setSaving(false);
      return;
    }
    const { error: dbError } = await supabase.from("saved_routes").insert({
      user_id: currentUser.id,
      from_station_id: payload.fromStationId,
      from_station_name: payload.fromStationName,
      to_station_id: payload.toStationId,
      to_station_name: payload.toStationName,
      nickname: nicknameVal.trim() || null,
    });
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      setSaved(true);
      setShowNickname(false);
    }
  }

  function handleSaveClick() {
    if (!user) {
      setShowAuth(true);
    } else {
      setShowNickname(true);
    }
  }

  // After auth success, open the nickname prompt and save
  function handleAuthSuccess() {
    setShowAuth(false);
    setShowNickname(true);
  }

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Saved
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleSaveClick}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {saving ? "Saving…" : "Save route"}
      </button>

      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}

      {/* Nickname prompt */}
      {showNickname && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNickname(false); }}>
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl space-y-3">
            <h3 className="font-semibold text-gray-900">Save this route</h3>
            <p className="text-sm text-gray-500">
              {payload.fromStationName} → {payload.toStationName}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nickname <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Morning commute"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") doSave(nickname); }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => doSave(nickname)}
                disabled={saving}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowNickname(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth gate */}
      {showAuth && (
        <AuthModal
          prompt="Sign in to save this route — it only takes a moment."
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function JourneyResults({ journeys, savePayload }: Props) {
  if (journeys.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {journeys.length === 1 ? "1 route found" : `${journeys.length} routes found`}
      </h2>

      {journeys.map((journey, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          {/* Journey summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {formatTime(journey.departureTime) && (
                <span>
                  <span className="font-medium text-gray-900">
                    {formatTime(journey.departureTime)}
                  </span>
                  {" → "}
                  <span className="font-medium text-gray-900">
                    {formatTime(journey.arrivalTime)}
                  </span>
                </span>
              )}
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 font-medium">
                {journey.duration} min
              </span>
              {formatFare(journey.fare) && (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-green-700 font-medium">
                  {formatFare(journey.fare)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {idx === 0 && (
                <span className="text-xs text-gray-400 font-medium">Fastest</span>
              )}
              {savePayload && <SaveButton payload={savePayload} />}
            </div>
          </div>

          {/* Legs */}
          <ol className="space-y-2">
            {journey.legs.map((leg, li) => (
              <li key={li} className="flex items-start gap-3 text-sm">
                <div className="pt-0.5 shrink-0">{modeBadge(leg.mode)}</div>
                <div className="min-w-0">
                  <div className="text-gray-800">
                    {leg.from && leg.to ? (
                      <>
                        <span className="font-medium">{leg.from}</span>
                        {" → "}
                        <span className="font-medium">{leg.to}</span>
                      </>
                    ) : (
                      leg.instruction
                    )}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5 flex flex-wrap gap-2">
                    {leg.lineName && leg.lineName !== leg.mode && (
                      <span>{leg.lineName}</span>
                    )}
                    <span>{leg.duration} min</span>
                    {leg.departureTime && (
                      <span>
                        {formatTime(leg.departureTime)} – {formatTime(leg.arrivalTime)}
                      </span>
                    )}
                  </div>
                  {leg.instruction &&
                    leg.from &&
                    leg.instruction !== `${leg.from} to ${leg.to}` && (
                      <p className="text-gray-500 text-xs mt-0.5 leading-snug line-clamp-2">
                        {leg.instruction}
                      </p>
                    )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
