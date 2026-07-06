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

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/stations/search?query=${encodeURIComponent(raw.trim())}`
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
    }, 300);
  }

  function select(station: StationMatch) {
    onChange(station);
    setQuery(station.name);
    setOpen(false);
    setResults([]);
  }

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
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
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
          </span>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2"
                onMouseDown={() => select(s)}
              >
                <span className="text-gray-400 text-xs">
                  {s.modes[0] ?? "•"}
                </span>
                <span>{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
