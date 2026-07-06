"use client";

import { useState, useEffect, useRef } from "react";
import type { StationMatch } from "@/lib/types";

interface Props {
  label: string;
  placeholder?: string;
  value: StationMatch | null;
  onChange: (station: StationMatch | null) => void;
}

export default function StationAutocomplete({
  label,
  placeholder = "Search stations…",
  value,
  onChange,
}: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<StationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync display text when external value changes
  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(raw: string) {
    setQuery(raw);
    onChange(null); // clear selected station when typing

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (raw.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    // 400ms debounce — /api/places/search calls Nominatim, don't hammer it
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places/search?query=${encodeURIComponent(raw.trim())}`
        );
        const data = await res.json();
        if (data.matches) {
          setResults(data.matches);
          setOpen(true);
        }
      } catch {
        // ignore network errors in autocomplete
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function select(station: StationMatch) {
    onChange(station);
    setQuery(station.name);
    setOpen(false);
    setResults([]);
  }

  // Is the user typing but hasn't confirmed a selection yet?
  const isTypingWithoutSelection = query.trim().length > 0 && value === null;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-1 ${
            value
              ? "border-green-400 focus:border-green-500 focus:ring-green-400"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
          autoComplete="off"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin text-gray-400"
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
          ) : value ? (
            <svg
              className="h-4 w-4 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </span>
      </div>

      {/* Hint: nudge user to pick from list */}
      {isTypingWithoutSelection && !open && !loading && (
        <p className="mt-1 text-xs text-amber-600">
          Type to search, then tap a result to select it
        </p>
      )}
      {isTypingWithoutSelection && open && (
        <p className="mt-1 text-xs text-gray-400">
          Select a station from the list below
        </p>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50 active:bg-blue-100 flex flex-col gap-0.5"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(s);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  select(s);
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="shrink-0 w-14 text-xs text-gray-400 capitalize truncate">
                    {s.modes[0] ?? "•"}
                  </span>
                  <span className="font-medium text-gray-900">{s.name}</span>
                </span>
                {/* Landmark label — shown only when it differs from the station name */}
                {s.label && s.label !== s.name && (
                  <span className="pl-16 text-xs text-blue-600 truncate">{s.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && !loading && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg px-3 py-2.5 text-sm text-gray-500">
          No stations found
        </div>
      )}
    </div>
  );
}
