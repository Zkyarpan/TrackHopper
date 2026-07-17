"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clock3Icon,
  Loader2Icon,
  MapIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import type { useJourneySearch } from "@/hooks/useJourneySearch";
import type { useNearbyStations } from "@/hooks/useNearbyStations";
import type { StationMatch } from "@/lib/types";
import StationAutocomplete from "@/components/station/StationAutocomplete";
import StationSwapButton from "@/components/station/StationSwapButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-success/10 px-2.5 text-xs font-semibold text-success-foreground transition-colors hover:bg-success/15"
      >
        <MapPinIcon className="size-3.5" />
        <span className="max-w-40 truncate">{geo.nearestStation.name}</span>
        <XIcon className="size-3" />
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
      className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-primary/7 hover:text-primary disabled:opacity-50"
    >
      {busy ? <Loader2Icon className="size-3.5 animate-spin" /> : <MapPinIcon className="size-3.5" />}
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
      <MapPinIcon />
      <AlertDescription>
        <p className="mb-2 text-sm font-semibold text-foreground">Multiple stations match &quot;{label}&quot;. Choose one:</p>
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
      const focusTimer = setTimeout(() => {
        setQuery("");
        setResults([]);
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(focusTimer);
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
    <Alert variant="warning">
      <MapPinIcon />
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
            className="font-semibold text-primary underline underline-offset-2"
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
    <Card className="surface-elevated relative overflow-visible rounded-[28px] border-white/80 bg-card/95 py-0 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <CardHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SparklesIcon className="size-5" />
          </span>
          <div>
            <CardTitle className="text-xl sm:text-2xl">Plan your next journey</CardTitle>
            <CardDescription className="mt-1 leading-5">
              Tell us naturally or choose exact stations.
            </CardDescription>
          </div>
        </div>

        <Tabs
          value={journey.mode}
          onValueChange={(v) => journey.setMode(v as "freetext" | "structured")}
          className="mt-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="freetext" className="flex-1">
              <MessageSquareTextIcon />
              Ask naturally
            </TabsTrigger>
            <TabsTrigger value="structured" className="flex-1">
              <MapIcon />
              Choose stations
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
        {journey.mode === "freetext" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="freetext-journey">Where do you want to go?</Label>
              <GeoButton geo={geo} />
            </div>
            <Textarea
              id="freetext-journey"
              value={journey.freeText}
              onChange={(e) => journey.setFreeText(e.target.value)}
              placeholder="Try “King’s Cross to London Bridge by 9am”"
              rows={3}
              className="min-h-28 bg-background/60 text-[15px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  journey.handleFreeTextSubmit();
                }
              }}
            />
            <div className="-mt-1 flex items-center justify-between gap-3 text-[11px] leading-4 text-muted-foreground">
              <span>Include a time if it matters.</span>
              <span className="hidden sm:inline">Enter to plan · Shift + Enter for a new line</span>
            </div>
            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={journey.handleFreeTextSubmit}
              disabled={journey.isLoading || !journey.freeText.trim()}
            >
              {journey.loading === "parsing" ? (
                <><Loader2Icon className="animate-spin" /> Understanding your request…</>
              ) : journey.loading === "searching" ? (
                <><Loader2Icon className="animate-spin" /> Finding stations…</>
              ) : (
                <><SendIcon /> Plan my journey</>
              )}
            </Button>

            {journey.needsOriginSearch && (
              <Alert>
                <MapPinIcon />
                <AlertDescription className="space-y-3">
                  <p className="font-semibold text-foreground">Where are you travelling from?</p>
                  <div className="relative">
                    <Input
                      value={journey.originQuery}
                      onChange={(e) => journey.searchOrigin(e.target.value)}
                      placeholder="Stratford, Mile End, Liverpool Street…"
                      autoFocus
                    />
                    {journey.originSearching && (
                      <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
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
                          className="w-full justify-start"
                          onClick={() => journey.confirmOrigin(s)}
                        >
                          <span className="w-14 shrink-0 truncate text-xs font-normal capitalize text-muted-foreground">{s.modes[0] ?? "•"}</span>
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
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/80 bg-background/55 p-4">
              <div className="relative pl-6">
                <span className="absolute top-7 bottom-7 left-[5px] w-px bg-border" />
                <span className="absolute top-[25px] left-0 size-[11px] rounded-full border-[3px] border-primary bg-card" />
                <span className="absolute bottom-[18px] left-0 size-[11px] rounded-full border-[3px] border-brand bg-card" />
                <StationAutocomplete
                  label="From"
                  placeholder="Departure station"
                  value={journey.structFrom}
                  onChange={journey.setStructFrom}
                />
                <div className="mt-2 flex items-center justify-between border-b border-border/70 pb-3">
                  <GeoButton geo={geo} />
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
                <div className="pt-3">
                  <StationAutocomplete
                    label="To"
                    placeholder="Destination station"
                    value={journey.structTo}
                    onChange={journey.setStructTo}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="mb-2.5 flex">
                <Clock3Icon className="size-4 text-muted-foreground" />
                When are you travelling?
              </Label>
              <div className="flex flex-wrap gap-2">
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
                  aria-label={journey.timeMode === "departAt" ? "Departure time" : "Arrival time"}
                  value={journey.timeValue}
                  onChange={(e) => journey.setTimeValue(e.target.value)}
                  className="mt-3 w-36 tabular-nums"
                />
              )}
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={journey.handleStructuredSubmit}
              disabled={journey.isLoading || !journey.structFrom || !journey.structTo}
            >
              {journey.loading === "planning" ? (
                <><Loader2Icon className="animate-spin" /> Finding the best routes…</>
              ) : (
                <><SendIcon /> Plan my journey</>
              )}
            </Button>
          </div>
        )}

        {journey.loading === "planning" && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary">
            <Loader2Icon className="size-4 animate-spin" />
            Checking live routes with TfL…
          </div>
        )}

        {journey.resolutionError && <ResolutionErrorPanel journey={journey} />}

        {journey.error && (
          <Alert variant="destructive">
            <AlertDescription>
              <span className="font-semibold">We couldn’t plan that journey. </span>{journey.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
