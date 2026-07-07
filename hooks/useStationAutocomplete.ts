/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState } from "react";
import { searchStations } from "@/lib/api";
import type { StationMatch } from "@/lib/types";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

export function useStationAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StationMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set right before a programmatic (non-typed) query update — e.g. syncing
  // the display text after a selection — so it doesn't re-trigger a search.
  const skipNextSearchRef = useRef(false);

  const clearSuggestions = () => setSuggestions([]);

  function setQuerySilently(text: string) {
    skipNextSearchRef.current = true;
    setSuggestions([]);
    setQuery(text);
  }

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const matches = await searchStations(query.trim());
        setSuggestions(matches);
      } catch {
        // ignore network errors in autocomplete
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { query, setQuery, setQuerySilently, suggestions, isLoading, clearSuggestions };
}
