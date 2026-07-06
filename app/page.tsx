"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { StationMatch, Journey, ParsedJourney } from "@/lib/types";
import StationAutocomplete from "@/components/StationAutocomplete";
import JourneyResults from "@/components/JourneyResults";
import LineStatusBanner from "@/components/LineStatusBanner";
import AppHeader from "@/components/AppHeader";
import { useGeolocation, type GeoState } from "@/lib/useGeolocation";
import NearbySuggestions from "@/components/NearbySuggestions";

// ─── helpers ────────────────────────────────────────────────────────────────

type Mode = "freetext" | "structured";
type LoadingState = "idle" | "parsing" | "searching" | "planning";

async function searchStation(name: string): Promise<StationMatch[]> {
  // Use /api/places/search so landmark names (e.g. "UEL Docklands") also resolve
  const res = await fetch(
    `/api/places/search?query=${encodeURIComponent(name)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Station search failed");
  return data.matches ?? [];
}

async function planJourney(
  from: string,
  to: string,
  arriveBy: string | null,
  departAt: string | null
): Promise<Journey[]> {
  const params = new URLSearchParams({ from, to });
  if (arriveBy) params.set("arriveBy", arriveBy);
  if (departAt) params.set("departAt", departAt);
  const res = await fetch(`/api/journey?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Journey planning failed");
  return data.journeys ?? [];
}

// ─── disambiguation ──────────────────────────────────────────────────────────

interface DisambiguateProps {
  label: string;
  matches: StationMatch[];
  onSelect: (s: StationMatch) => void;
}

function DisambiguationPicker({ label, matches, onSelect }: DisambiguateProps) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
      <p className="text-sm font-medium text-blue-800 mb-2">
        Multiple stations match "{label}" — pick one:
      </p>
      <ul className="space-y-1">
        {matches.slice(0, 6).map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s)}
              className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-blue-100 text-blue-900 flex items-center gap-2"
            >
              <span className="text-xs text-blue-400">{s.modes[0] ?? "•"}</span>
              {s.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── geo button ──────────────────────────────────────────────────────────────



function GeoButton({ geo, onLocate, onReset }: { geo: GeoState; onLocate: () => void; onReset: () => void }) {
  if (geo.status === "done") {
    return (
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {geo.station.name} ✕
      </button>
    );
  }
  if (geo.status === "error") {
    return (
      <span className="text-xs text-red-500 flex items-center gap-1">
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        {geo.message}
      </span>
    );
  }
  const busy = geo.status === "locating" || geo.status === "resolving";
  return (
    <button
      type="button"
      onClick={onLocate}
      disabled={busy}
      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 disabled:opacity-50 transition-colors"
    >
      {busy ? (
        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
      {geo.status === "locating" ? "Getting location…" : geo.status === "resolving" ? "Finding nearest station…" : "Use my location"}
    </button>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

function HomePage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("freetext");

  // free-text state
  const [freeText, setFreeText] = useState("");

  // structured form state
  const [structFrom, setStructFrom] = useState<StationMatch | null>(null);
  const [structTo, setStructTo] = useState<StationMatch | null>(null);
  const [timeMode, setTimeMode] = useState<"none" | "departAt" | "arriveBy">("none");
  const [timeValue, setTimeValue] = useState("");

  // disambiguation
  const [disambigFrom, setDisambigFrom] = useState<StationMatch[] | null>(null);
  const [disambigTo, setDisambigTo] = useState<StationMatch[] | null>(null);
  const [pendingParsed, setPendingParsed] = useState<ParsedJourney | null>(null);
  // When free-text has no origin, ask for it inline
  const [needsOriginSearch, setNeedsOriginSearch] = useState(false);
  const [originQuery, setOriginQuery] = useState("");
  const [originResults, setOriginResults] = useState<StationMatch[]>([]);
  const [originSearching, setOriginSearching] = useState(false);

  // results / status
  const [loading, setLoading] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  // save payload — the resolved station names/ids to pass to save button
  const [savePayload, setSavePayload] = useState<{
    fromStationId: string; fromStationName: string;
    toStationId: string; toStationName: string;
  } | null>(null);

  // geolocation
  const { geo, locate, reset: resetGeo } = useGeolocation();
  // When geo resolves, pre-fill the "from" input in the active mode
  useEffect(() => {
    if (geo.status !== "done") return;
    if (mode === "structured") {
      setStructFrom(geo.station);
    } else {
      // In free-text mode, inject the station name into the text area
      setFreeText((prev) => {
        const prefix = `from ${geo.station.name} `;
        if (prev.startsWith("from ")) return prev; // already has origin
        return prefix + prev;
      });
    }
  }, [geo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── re-run from saved routes (query params) ──────────────────────────────

  useEffect(() => {
    const fromId = searchParams.get("fromId");
    const fromName = searchParams.get("fromName");
    const toId = searchParams.get("toId");
    const toName = searchParams.get("toName");
    if (!fromId || !fromName || !toId || !toName) return;

    const from: StationMatch = { id: fromId, name: fromName, modes: [] };
    const to: StationMatch = { id: toId, name: toName, modes: [] };
    setMode("structured");
    setStructFrom(from);
    setStructTo(to);
    setSavePayload({ fromStationId: fromId, fromStationName: fromName, toStationId: toId, toStationName: toName });
    // Immediately trigger the journey plan
    setError(null);
    setJourneys(null);
    setLoading("planning");
    planJourney(fromId, toId, null, null)
      .then((results) => setJourneys(results))
      .catch((e) => setError(e instanceof Error ? e.message : "Journey planning failed"))
      .finally(() => setLoading("idle"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── free-text submit ────────────────────────────────────────────────────

  // ── origin search (when free-text gave no origin) ────────────────────────

  async function searchOrigin(q: string) {
    setOriginQuery(q);
    if (q.trim().length < 2) { setOriginResults([]); return; }
    setOriginSearching(true);
    try {
      const res = await fetch(`/api/places/search?query=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setOriginResults(data.matches ?? []);
    } catch { /* ignore */ }
    finally { setOriginSearching(false); }
  }

  async function confirmOrigin(station: StationMatch) {
    if (!pendingParsed) return;
    setNeedsOriginSearch(false);
    setOriginQuery("");
    setOriginResults([]);
    const updated = { ...pendingParsed, from: station.id };
    // Store the origin station name for saving
    setSavePayload((prev) => prev ? { ...prev, fromStationId: station.id, fromStationName: station.name } : null);
    setPendingParsed(updated);

    // Now proceed to plan (or disambig destination if needed)
    if (disambigTo) return; // still waiting on destination disambig
    setLoading("planning");
    setError(null);
    try {
      const results = await planJourney(updated.from, updated.to, updated.arriveBy, updated.departAt);
      setJourneys(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Journey planning failed");
    } finally {
      setLoading("idle");
    }
  }

  // ── free-text submit ────────────────────────────────────────────────────

  const handleFreeTextSubmit = useCallback(async () => {
    if (!freeText.trim()) return;
    setError(null);
    setJourneys(null);
    setSavePayload(null);
    setDisambigFrom(null);
    setDisambigTo(null);
    setPendingParsed(null);
    setNeedsOriginSearch(false);

    // 1. Parse the natural language
    setLoading("parsing");
    let parsed: ParsedJourney;
    try {
      const res = await fetch("/api/parse-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: freeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to parse journey");
      parsed = data as ParsedJourney;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse journey");
      setLoading("idle");
      return;
    }

    // 2. Search both stations
    setLoading("searching");
    let fromMatches: StationMatch[] = [];
    let toMatches: StationMatch[] = [];
    try {
      [fromMatches, toMatches] = await Promise.all([
        searchStation(parsed.from),
        searchStation(parsed.to),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Station search failed");
      setLoading("idle");
      return;
    }

    if (fromMatches.length === 0 || parsed.from === "current location") {
      // Instead of erroring, ask for the origin inline
      setPendingParsed({ ...parsed, to: toMatches.length === 1 ? toMatches[0].id : parsed.to });
      if (toMatches.length > 1) setDisambigTo(toMatches);
      setNeedsOriginSearch(true);
      setLoading("idle");
      return;
    }
    if (toMatches.length === 0) {
      setError(`Could not find a station matching "${parsed.to}". Try the structured form below.`);
      setLoading("idle");
      return;
    }

    // 3. Disambiguation if needed
    const needsFromDisambig = fromMatches.length > 1;
    const needsToDisambig = toMatches.length > 1;

    if (needsFromDisambig || needsToDisambig) {
      setPendingParsed(parsed);
      if (needsFromDisambig) setDisambigFrom(fromMatches);
      if (needsToDisambig) setDisambigTo(toMatches);
      setLoading("idle");
      // Store the resolved ones for the case where only one needs disambig
      if (!needsFromDisambig) {
        setPendingParsed({
          ...parsed,
          from: fromMatches[0].id,
        });
      }
      if (!needsToDisambig) {
        setPendingParsed((prev) =>
          prev ? { ...prev, to: toMatches[0].id } : { ...parsed, to: toMatches[0].id }
        );
      }
      return;
    }

    // 4. All resolved — plan
    setSavePayload({
      fromStationId: fromMatches[0].id, fromStationName: fromMatches[0].name,
      toStationId: toMatches[0].id, toStationName: toMatches[0].name,
    });
    setLoading("planning");
    try {
      const results = await planJourney(
        fromMatches[0].id,
        toMatches[0].id,
        parsed.arriveBy,
        parsed.departAt
      );
      setJourneys(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Journey planning failed");
    } finally {
      setLoading("idle");
    }
  }, [freeText]);

  // ── disambiguation resolution ────────────────────────────────────────────

  const resolveDisambig = useCallback(
    async (side: "from" | "to", station: StationMatch) => {
      if (!pendingParsed) return;

      const updatedParsed = {
        ...pendingParsed,
        [side]: station.id,
      };
      setPendingParsed(updatedParsed);

      if (side === "from") setDisambigFrom(null);
      if (side === "to") setDisambigTo(null);

      // Check if the other side also still needs disambiguation
      const stillNeedsFrom = side === "to" && disambigFrom !== null;
      const stillNeedsTo = side === "from" && disambigTo !== null;

      if (stillNeedsFrom || stillNeedsTo) return;

      // Both resolved — plan journey
      setLoading("planning");
      setError(null);
      // We don't have station names at this point (only IDs from parsed),
      // so clear savePayload — user can still save from structured form.
      setSavePayload(null);
      try {
        const results = await planJourney(
          updatedParsed.from,
          updatedParsed.to,
          updatedParsed.arriveBy,
          updatedParsed.departAt
        );
        setJourneys(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Journey planning failed");
      } finally {
        setLoading("idle");
      }
    },
    [pendingParsed, disambigFrom, disambigTo]
  );

  // ── structured form submit ───────────────────────────────────────────────

  const handleStructuredSubmit = useCallback(async () => {
    if (!structFrom || !structTo) {
      setError("Please select both a departure and destination station.");
      return;
    }
    setError(null);
    setJourneys(null);
    setSavePayload({
      fromStationId: structFrom.id, fromStationName: structFrom.name,
      toStationId: structTo.id, toStationName: structTo.name,
    });
    setLoading("planning");
    try {
      const results = await planJourney(
        structFrom.id,
        structTo.id,
        timeMode === "arriveBy" ? timeValue : null,
        timeMode === "departAt" ? timeValue : null
      );
      setJourneys(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Journey planning failed");
    } finally {
      setLoading("idle");
    }
  }, [structFrom, structTo, timeMode, timeValue]);

  // ── render ───────────────────────────────────────────────────────────────

  const isLoading = loading !== "idle";

  return (
    <main className="min-h-screen bg-gray-50">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Line status banner */}
        <LineStatusBanner />

        {/* Mode switcher */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-1 gap-1">
          <button
            type="button"
            onClick={() => { setMode("freetext"); setError(null); setJourneys(null); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "freetext"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Ask in plain English
          </button>
          <button
            type="button"
            onClick={() => { setMode("structured"); setError(null); setJourneys(null); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "structured"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Choose stations
          </button>
        </div>

        {/* Nearby suggestions — shown only after location is granted */}
        {geo.status === "done" && (
          <NearbySuggestions
            lat={geo.lat}
            lon={geo.lon}
            onSelectFrom={(station) => {
              setStructFrom(station);
              setMode("structured");
            }}
            onRunSavedRoute={(from, to) => {
              setStructFrom(from);
              setStructTo(to);
              setMode("structured");
              setSavePayload({
                fromStationId: from.id, fromStationName: from.name,
                toStationId: to.id, toStationName: to.name,
              });
              setError(null);
              setJourneys(null);
              setLoading("planning");
              planJourney(from.id, to.id, null, null)
                .then((results) => setJourneys(results))
                .catch((e) => setError(e instanceof Error ? e.message : "Journey planning failed"))
                .finally(() => setLoading("idle"));
            }}
          />
        )}

        {/* Free-text panel */}
        {mode === "freetext" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Where do you want to go?
              </label>
              <GeoButton geo={geo} onLocate={locate} onReset={resetGeo} />
            </div>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="e.g. from Stratford to UEL by 9am, or from King's Cross to London Bridge"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleFreeTextSubmit();
                }
              }}
            />
            <button
              type="button"
              onClick={handleFreeTextSubmit}
              disabled={isLoading || !freeText.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === "parsing"
                ? "Understanding your request…"
                : loading === "searching"
                ? "Finding stations…"
                : "Plan journey"}
            </button>

            {/* Inline origin picker when free-text had no departure station */}
            {needsOriginSearch && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                <p className="text-sm font-medium text-blue-800">
                  Where are you travelling <span className="underline">from</span>?
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={originQuery}
                    onChange={(e) => searchOrigin(e.target.value)}
                    placeholder="e.g. Stratford, Mile End, Liverpool Street…"
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  {originSearching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    </span>
                  )}
                </div>
                {originResults.length > 0 && (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {originResults.slice(0, 6).map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => confirmOrigin(s)}
                          className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-blue-100 text-blue-900 flex items-center gap-2"
                        >
                          <span className="text-xs text-blue-400 w-12 shrink-0 capitalize truncate">{s.modes[0] ?? "•"}</span>
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Disambiguation pickers */}
            {disambigFrom && (
              <DisambiguationPicker
                label={pendingParsed?.from ?? "origin"}
                matches={disambigFrom}
                onSelect={(s) => resolveDisambig("from", s)}
              />
            )}
            {disambigTo && (
              <DisambiguationPicker
                label={pendingParsed?.to ?? "destination"}
                matches={disambigTo}
                onSelect={(s) => resolveDisambig("to", s)}
              />
            )}
          </div>
        )}

        {/* Structured form panel */}
        {mode === "structured" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <StationAutocomplete
                label="From"
                placeholder="Departure station"
                value={structFrom}
                onChange={setStructFrom}
              />
              <div className="mt-1.5">
                <GeoButton geo={geo} onLocate={locate} onReset={resetGeo} />
              </div>
            </div>
            <StationAutocomplete
              label="To"
              placeholder="Destination station"
              value={structTo}
              onChange={setStructTo}
            />

            {/* Time options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time (optional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(["none", "departAt", "arriveBy"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTimeMode(opt)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      timeMode === opt
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {opt === "none"
                      ? "Leave now"
                      : opt === "departAt"
                      ? "Depart at"
                      : "Arrive by"}
                  </button>
                ))}
              </div>
              {timeMode !== "none" && (
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>

            <button
              type="button"
              onClick={handleStructuredSubmit}
              disabled={isLoading || !structFrom || !structTo}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === "planning" ? "Finding routes…" : "Plan journey"}
            </button>
          </div>
        )}

        {/* Global loading indicator */}
        {loading === "planning" && (
          <div className="flex items-center gap-2 text-sm text-gray-500 px-1">
            <svg
              className="h-4 w-4 animate-spin text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Checking routes with TfL…
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-medium">Error: </span>
            {error}
          </div>
        )}

        {/* Results */}
        {journeys !== null && journeys.length > 0 && (
          <JourneyResults journeys={journeys} savePayload={savePayload ?? undefined} />
        )}
        {journeys !== null && journeys.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
            No routes found between those stations.
          </div>
        )}
      </div>
    </main>
  );
}

// Wrap with Suspense because useSearchParams() requires it in the App Router
export default function Page() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}
