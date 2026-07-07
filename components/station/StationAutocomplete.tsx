/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { CheckCircle2Icon, Loader2Icon, MapPinIcon } from "lucide-react";
import type { StationMatch } from "@/lib/types";
import { useStationAutocomplete } from "@/hooks/useStationAutocomplete";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

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
  const { query, setQuery, setQuerySilently, suggestions, isLoading, clearSuggestions } = useStationAutocomplete();
  const [open, setOpen] = useState(false);

  // Sync display text when a station is set from outside typing (geolocation
  // prefill, swap button, or a selection just confirmed) — silently, so it
  // doesn't re-trigger a search. Clearing to null is already handled by
  // handleInput itself and must not be overridden here mid-keystroke.
  useEffect(() => {
    if (value) setQuerySilently(value.name);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (suggestions.length > 0) setOpen(true);
  }, [suggestions]);

  function handleInput(raw: string) {
    setQuery(raw);
    if (value !== null) onChange(null); // clear selected station only if one was set
    if (raw.trim().length < 2) {
      clearSuggestions();
      setOpen(false);
    }
  }

  function select(station: StationMatch) {
    onChange(station);
    setOpen(false);
  }

  const isTypingWithoutSelection = query.trim().length > 0 && value === null;
  const inputId = `station-${label.toLowerCase()}`;

  return (
    <div className="space-y-1">
      <Label htmlFor={inputId}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<div className="relative" />} nativeButton={false}>
          <Input
            id={inputId}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className={value ? "border-green-400 pr-9 focus-visible:ring-green-400/50" : "pr-9"}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : value ? (
              <CheckCircle2Icon className="h-4 w-4 text-green-500" />
            ) : null}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--anchor-width) p-0">
          <Command shouldFilter={false}>
            <CommandList>
              {!isLoading && <CommandEmpty>No stations found</CommandEmpty>}
              <CommandGroup>
                {suggestions.map((s) => (
                  <CommandItem key={s.id} value={s.id} onSelect={() => select(s)}>
                    <MapPinIcon className="text-muted-foreground" />
                    <div className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-2">
                        <span className="w-14 shrink-0 truncate text-xs capitalize text-muted-foreground">
                          {s.modes[0] ?? "•"}
                        </span>
                        <span className="truncate font-medium">{s.name}</span>
                      </span>
                      {s.label && s.label !== s.name && (
                        <span className="truncate pl-16 text-xs text-primary">{s.label}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {isTypingWithoutSelection && !open && !isLoading && (
        <p className="text-xs text-amber-600">Type to search, then tap a result to select it</p>
      )}
    </div>
  );
}
