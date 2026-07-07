/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseJourneyText, planJourney, searchStations } from "@/lib/api";
import type { StationMatch, Journey, ParsedJourney, SaveRoutePayload } from "@/lib/types";

export type JourneyMode = "freetext" | "structured";
export type JourneyLoadingState = "idle" | "parsing" | "searching" | "planning";
export type TimeMode = "none" | "departAt" | "arriveBy";

export function useJourneySearch() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<JourneyMode>("freetext");

  const [freeText, setFreeText] = useState("");

  const [structFrom, setStructFrom] = useState<StationMatch | null>(null);
  const [structTo, setStructTo] = useState<StationMatch | null>(null);
  const [timeMode, setTimeMode] = useState<TimeMode>("none");
  const [timeValue, setTimeValue] = useState("");

  const [disambigFrom, setDisambigFrom] = useState<StationMatch[] | null>(null);
  const [disambigTo, setDisambigTo] = useState<StationMatch[] | null>(null);
  const [pendingParsed, setPendingParsed] = useState<ParsedJourney | null>(null);
  const [needsOriginSearch, setNeedsOriginSearch] = useState(false);
  const [originQuery, setOriginQuery] = useState("");
  const [originResults, setOriginResults] = useState<StationMatch[]>([]);
  const [originSearching, setOriginSearching] = useState(false);

  const [loading, setLoading] = useState<JourneyLoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  const [savePayload, setSavePayload] = useState<SaveRoutePayload | null>(null);

  const switchMode = useCallback((next: JourneyMode) => {
    setMode(next);
    setError(null);
    setJourneys(null);
  }, []);

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
    setError(null);
    setJourneys(null);
    setLoading("planning");
    planJourney(fromId, toId, null, null)
      .then(setJourneys)
      .catch((e) => setError(e instanceof Error ? e.message : "Journey planning failed"))
      .finally(() => setLoading("idle"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── origin search (when free-text gave no origin) ────────────────────────
  async function searchOrigin(q: string) {
    setOriginQuery(q);
    if (q.trim().length < 2) {
      setOriginResults([]);
      return;
    }
    setOriginSearching(true);
    try {
      setOriginResults(await searchStations(q.trim()));
    } catch {
      /* ignore */
    } finally {
      setOriginSearching(false);
    }
  }

  async function confirmOrigin(station: StationMatch) {
    if (!pendingParsed) return;
    setNeedsOriginSearch(false);
    setOriginQuery("");
    setOriginResults([]);
    const updated = { ...pendingParsed, from: station.id };
    setSavePayload((prev) => (prev ? { ...prev, fromStationId: station.id, fromStationName: station.name } : null));
    setPendingParsed(updated);

    if (disambigTo) return; // still waiting on destination disambig
    setLoading("planning");
    setError(null);
    try {
      setJourneys(await planJourney(updated.from, updated.to, updated.arriveBy, updated.departAt));
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

    setLoading("parsing");
    let parsed: ParsedJourney;
    try {
      parsed = await parseJourneyText(freeText);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse journey");
      setLoading("idle");
      return;
    }

    setLoading("searching");
    let fromMatches: StationMatch[] = [];
    let toMatches: StationMatch[] = [];
    try {
      [fromMatches, toMatches] = await Promise.all([searchStations(parsed.from), searchStations(parsed.to)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Station search failed");
      setLoading("idle");
      return;
    }

    if (fromMatches.length === 0 || parsed.from === "current location") {
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

    const needsFromDisambig = fromMatches.length > 1;
    const needsToDisambig = toMatches.length > 1;

    if (needsFromDisambig || needsToDisambig) {
      setPendingParsed(parsed);
      if (needsFromDisambig) setDisambigFrom(fromMatches);
      if (needsToDisambig) setDisambigTo(toMatches);
      setLoading("idle");
      if (!needsFromDisambig) setPendingParsed({ ...parsed, from: fromMatches[0].id });
      if (!needsToDisambig) {
        setPendingParsed((prev) => (prev ? { ...prev, to: toMatches[0].id } : { ...parsed, to: toMatches[0].id }));
      }
      return;
    }

    setSavePayload({
      fromStationId: fromMatches[0].id,
      fromStationName: fromMatches[0].name,
      toStationId: toMatches[0].id,
      toStationName: toMatches[0].name,
    });
    setLoading("planning");
    try {
      setJourneys(await planJourney(fromMatches[0].id, toMatches[0].id, parsed.arriveBy, parsed.departAt));
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
      const updatedParsed = { ...pendingParsed, [side]: station.id };
      setPendingParsed(updatedParsed);
      if (side === "from") setDisambigFrom(null);
      if (side === "to") setDisambigTo(null);

      const stillNeedsFrom = side === "to" && disambigFrom !== null;
      const stillNeedsTo = side === "from" && disambigTo !== null;
      if (stillNeedsFrom || stillNeedsTo) return;

      setLoading("planning");
      setError(null);
      // We only have station IDs here (not names), so clear savePayload —
      // the structured form still lets the user save afterwards.
      setSavePayload(null);
      try {
        setJourneys(
          await planJourney(updatedParsed.from, updatedParsed.to, updatedParsed.arriveBy, updatedParsed.departAt)
        );
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
      fromStationId: structFrom.id,
      fromStationName: structFrom.name,
      toStationId: structTo.id,
      toStationName: structTo.name,
    });
    setLoading("planning");
    try {
      setJourneys(
        await planJourney(
          structFrom.id,
          structTo.id,
          timeMode === "arriveBy" ? timeValue : null,
          timeMode === "departAt" ? timeValue : null
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Journey planning failed");
    } finally {
      setLoading("idle");
    }
  }, [structFrom, structTo, timeMode, timeValue]);

  // ── run a saved route directly (from NearbySuggestions quick-pick) ───────
  const runSavedRoute = useCallback(async (from: StationMatch, to: StationMatch) => {
    setStructFrom(from);
    setStructTo(to);
    setMode("structured");
    setSavePayload({
      fromStationId: from.id,
      fromStationName: from.name,
      toStationId: to.id,
      toStationName: to.name,
    });
    setError(null);
    setJourneys(null);
    setLoading("planning");
    try {
      setJourneys(await planJourney(from.id, to.id, null, null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Journey planning failed");
    } finally {
      setLoading("idle");
    }
  }, []);

  return {
    mode,
    setMode: switchMode,
    freeText,
    setFreeText,
    structFrom,
    setStructFrom,
    structTo,
    setStructTo,
    timeMode,
    setTimeMode,
    timeValue,
    setTimeValue,
    disambigFrom,
    disambigTo,
    pendingParsed,
    needsOriginSearch,
    originQuery,
    originResults,
    originSearching,
    searchOrigin,
    confirmOrigin,
    loading,
    isLoading: loading !== "idle",
    error,
    journeys,
    savePayload,
    handleFreeTextSubmit,
    handleStructuredSubmit,
    resolveDisambig,
    runSavedRoute,
  };
}
