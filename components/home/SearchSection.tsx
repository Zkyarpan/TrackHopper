"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2Icon, MapPinIcon, XIcon, SendIcon } from "lucide-react";
import type { useJourneySearch } from "@/hooks/useJourneySearch";
import type { useNearbyStations } from "@/hooks/useNearbyStations";
import type { StationMatch } from "@/lib/types";
import StationAutocomplete from "@/components/station/StationAutocomplete";
import StationSwapButton from "@/components/station/StationSwapButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { searchStations } from "@/lib/api";

type JourneySearch = ReturnType<typeof useJourneySearch>;
type NearbyState = ReturnType<typeof useNearbyStations>;

function GeoButton({ geo }: { geo: NearbyState }) {
  if (geo.phase === "done" && geo.nearestStation) {
    return (
      <button
        type="button"
        onClick={geo.reset}
        className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
      >
        <MapPinIcon className="h-3.5 w-3.5" />
        {geo.nearestStation.name}
        <XIcon className="h-3 w-3" />
      </button>
    );
  }
  if (geo.phase === "error") {
    return <span className="text-xs text-destructive">{geo.error}</span>;
  }
  const busy = geo.phase === "locating" || geo.phase === "resolving";
  return (
    <button
      type="button"
      onClick={geo.requestLocation}
      disabled={busy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
    >
      {busy ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <MapPinIcon className="h-3.5 w-3.5" />}
      {geo.phase === "locating" ? "Getting location…" : geo.phase === "resolving" ? "Finding nearest station…" : "Use my location"}
    </button>
  );
}

function DisambiguationPicker({
  label,
  matches,
  onSelect,
}: {
  label: string;
  matches: StationMatch[];
  onSelect: (s: StationMatch) => void;
}) {
  return (
    <Alert>
      <AlertDescription>
        <p className="mb-2 text-sm font-medium text-foreground">Multiple stations match &quot;{label}&quot; — pick one:</p>
        <div className="space-y-1">
          {matches.slice(0, 6).map((s) => (
            <Button
              key={s.id}
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => onSelect(s)}
            >
              <span className="w-12 shrink-0 truncate text-xs capitalize text-muted-foreground">{s.modes[0] ?? "•"}</span>
              {s.name}
            </Button>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/** Shown when one side of free-text resolution fails — lets user pick a near-miss or search manually */
function ResolutionErrorPanel({ journey }: { journey: JourneySearch }) {
  const re = journey.resolutionError;
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<StationMatch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (re) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [re]);

  if (!re) return null;

  const sideLabel = re.side === "to" ? "destination" : "origin";
  const resolvedLabel = re.resolvedStation ? (
    <span>
      {re.side === "to" ? "From" : "To"}{" "}
      <strong>{re.resolvedStation.name}</strong> was found, but{" "}
    </span>
  ) : null;

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try { setResults(await searchStations(q.trim())); } catch { /* ignore */ }
    finally { setSearching(false); }
  }

  const candidates = re.nearMisses.length > 0 ? re.nearMisses : results;

  return (
    <Alert>
      <AlertDescription className="space-y-3">
        <p className="text-sm text-foreground">
          {resolvedLabel}
          <span>
            couldn&apos;t place <strong>&quot;{re.failedQuery}&quot;</strong> as a {sideLabel}.
            {re.nearMisses.length === 0 && " Search for the correct station below:"}
          </span>
        </p>

        {re.nearMisses.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">Did you mean one of these?</p>
            <div className="space-y-1">
              {re.nearMisses.slice(0, 5).map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => journey.selectNearMiss(s)}
                >
                  <span className="w-12 shrink-0 truncate text-xs capitalize text-muted-foreground">{s.modes[0] ?? "•"}</span>
                  {s.label ?? s.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Or search manually:</p>
          </>
        )}

        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={`Search for ${sideLabel}…`}
          />
          {searching && (
            <Loader2Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {candidates.length > 0 && re.nearMisses.length === 0 && (
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {candidates.slice(0, 6).map((s) => (
              <Button
                key={s.id}
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => journey.selectNearMiss(s)}
              >
                <span className="w-12 shrink-0 truncate text-xs capitalize text-muted-foreground">{s.modes[0] ?? "•"}</span>
                {s.name}
              </Button>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Or switch to{" "}
          <button
            type="button"
            className="underline"
            onClick={() => journey.setMode("structured")}
          >
            Choose stations
          </button>{" "}
          for exact matching.
        </p>
      </AlertDescription>
    </Alert>
  );
}

interface Props {
  journey: JourneySearch;
  geo: NearbyState;
}

export default function SearchSection({ journey, geo }: Props) {
  return (
    <div className="space-y-4">
      <Tabs value={journey.mode} onValueChange={(v) => journey.setMode(v as "freetext" | "structured")}>
        <TabsList className="w-full">
          <TabsTrigger value="freetext" className="flex-1">Ask in plain English</TabsTrigger>
          <TabsTrigger value="structured" className="flex-1">Choose stations</TabsTrigger>
        </TabsList>
      </Tabs>

      {journey.mode === "freetext" ? (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="freetext-journey">Where do you want to go?</Label>
              <GeoButton geo={geo} />
            </div>
            <Textarea
              id="freetext-journey"
              value={journey.freeText}
              onChange={(e) => journey.setFreeText(e.target.value)}
              placeholder="e.g. from Stratford to UEL by 9am, or from King's Cross to London Bridge"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  journey.handleFreeTextSubmit();
                }
              }}
            />
            <Button
              type="button"
              className="w-full"
              onClick={journey.handleFreeTextSubmit}
              disabled={journey.isLoading || !journey.freeText.trim()}
            >
              {journey.loading === "parsing" ? (
                "Understanding your request…"
              ) : journey.loading === "searching" ? (
                "Finding stations…"
              ) : (
                <>
                  <SendIcon /> Plan journey
                </>
              )}
            </Button>

            {journey.needsOriginSearch && (
              <Alert>
                <AlertDescription className="space-y-2">
                  <p className="font-medium text-foreground">
                    Where are you travelling <span className="underline">from</span>?
                  </p>
                  <div className="relative">
                    <Input
                      value={journey.originQuery}
                      onChange={(e) => journey.searchOrigin(e.target.value)}
                      placeholder="e.g. Stratford, Mile End, Liverpool Street…"
                      autoFocus
                    />
                    {journey.originSearching && (
                      <Loader2Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {journey.originResults.length > 0 && (
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {journey.originResults.slice(0, 6).map((s) => (
                        <Button
                          key={s.id}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => journey.confirmOrigin(s)}
                        >
                          <span className="w-12 shrink-0 truncate text-xs capitalize text-muted-foreground">{s.modes[0] ?? "•"}</span>
                          {s.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {journey.disambigFrom && (
              <DisambiguationPicker
                label={journey.pendingParsed?.from ?? "origin"}
                matches={journey.disambigFrom}
                onSelect={(s) => journey.resolveDisambig("from", s)}
              />
            )}
            {journey.disambigTo && (
              <DisambiguationPicker
                label={journey.pendingParsed?.to ?? "destination"}
                matches={journey.disambigTo}
                onSelect={(s) => journey.resolveDisambig("to", s)}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4">
            <div>
              <StationAutocomplete
                label="From"
                placeholder="Departure station"
                value={journey.structFrom}
                onChange={journey.setStructFrom}
              />
              <div className="mt-1.5">
                <GeoButton geo={geo} />
              </div>
            </div>

            <div className="-my-2 flex justify-center">
              <StationSwapButton
                onSwap={() => {
                  const from = journey.structFrom;
                  const to = journey.structTo;
                  journey.setStructFrom(to);
                  journey.setStructTo(from);
                }}
                disabled={!journey.structFrom && !journey.structTo}
              />
            </div>

            <StationAutocomplete
              label="To"
              placeholder="Destination station"
              value={journey.structTo}
              onChange={journey.setStructTo}
            />

            <Separator />

            <div>
              <Label className="mb-1.5 block">Time (optional)</Label>
              <div className="mb-2 flex flex-wrap gap-2">
                {(["none", "departAt", "arriveBy"] as const).map((opt) => (
                  <Toggle
                    key={opt}
                    pressed={journey.timeMode === opt}
                    onPressedChange={() => journey.setTimeMode(opt)}
                    variant="outline"
                    size="sm"
                  >
                    {opt === "none" ? "Leave now" : opt === "departAt" ? "Depart at" : "Arrive by"}
                  </Toggle>
                ))}
              </div>
              {journey.timeMode !== "none" && (
                <Input
                  type="time"
                  value={journey.timeValue}
                  onChange={(e) => journey.setTimeValue(e.target.value)}
                  className="w-auto"
                />
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={journey.handleStructuredSubmit}
              disabled={journey.isLoading || !journey.structFrom || !journey.structTo}
            >
              {journey.loading === "planning" ? (
                "Finding routes…"
              ) : (
                <>
                  <SendIcon /> Plan journey
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {journey.loading === "planning" && (
        <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
          <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
          Checking routes with TfL…
        </div>
      )}

      {journey.resolutionError && <ResolutionErrorPanel journey={journey} />}

      {journey.error && (
        <Alert variant="destructive">
          <AlertDescription>
            <span className="font-medium">Error: </span>{journey.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
