"use client";

import { useState, useCallback } from "react";
import type { StationMatch, Journey, ParsedJourney } from "@/lib/types";
import StationAutocomplete from "@/components/StationAutocomplete";
import JourneyResults from "@/components/JourneyResults";
import LineStatusBanner from "@/components/LineStatusBanner";

// ─── helpers ────────────────────────────────────────────────────────────────

type Mode = "freetext" | "structured";
type LoadingState = "idle" | "parsing" | "searching" | "planning";

async function searchStation(name: string): Promise<StationMatch[]> {
  const res = await fetch(
    `/api/stations/search?query=${encodeURIComponent(name)}`
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

// ─── main page ───────────────────────────────────────────────────────────────

export default function HomePage() {
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

  // ── free-text submit ────────────────────────────────────────────────────

  // ── origin search (when free-text gave no origin) ────────────────────────

  async function searchOrigin(q: string) {
    setOriginQuery(q);
    if (q.trim().length < 2) { setOriginResults([]); return; }
    setOriginSearching(true);
    try {
      const res = await fetch(`/api/stations/search?query=${encodeURIComponent(q.trim())}`);
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">TH</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">
              TrackHopper
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              London journey planner
            </p>
          </div>
        </div>
      </header>

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

        {/* Free-text panel */}
        {mode === "freetext" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Where do you want to go?
            </label>
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
            <StationAutocomplete
              label="From"
              placeholder="Departure station"
              value={structFrom}
              onChange={setStructFrom}
            />
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
          <JourneyResults journeys={journeys} />
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
