"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  ArrowRightIcon,
  BikeIcon,
  BusFrontIcon,
  CheckIcon,
  Clock3Icon,
  FootprintsIcon,
  HeartIcon,
  MapPinnedIcon,
  SparklesIcon,
  TrainFrontIcon,
  TramFrontIcon,
} from "lucide-react";
import type { Journey, JourneyLeg, SaveRoutePayload } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const JourneyMap = dynamic(() => import("@/components/home/JourneyMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full rounded-2xl" />,
});

const MODE_LABELS: Record<string, string> = {
  tube: "Tube",
  bus: "Bus",
  walking: "Walk",
  walk: "Walk",
  "elizabeth-line": "Elizabeth line",
  overground: "Overground",
  dlr: "DLR",
  tram: "Tram",
  "national-rail": "Rail",
  cycle: "Cycle",
  "cycle-hire": "Cycle hire",
};

const MODE_STYLES: Record<string, string> = {
  tube: "border-red-200 bg-red-50 text-red-700",
  bus: "border-red-200 bg-red-50 text-red-700",
  walking: "border-emerald-200 bg-emerald-50 text-emerald-700",
  walk: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "elizabeth-line": "border-purple-200 bg-purple-50 text-purple-700",
  overground: "border-orange-200 bg-orange-50 text-orange-700",
  dlr: "border-teal-200 bg-teal-50 text-teal-700",
  tram: "border-green-200 bg-green-50 text-green-700",
  "national-rail": "border-blue-200 bg-blue-50 text-blue-700",
  cycle: "border-amber-200 bg-amber-50 text-amber-700",
  "cycle-hire": "border-amber-200 bg-amber-50 text-amber-700",
};

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
  return fare === null ? null : `£${fare.toFixed(2)}`;
}

function LegIcon({ mode }: { mode: JourneyLeg["mode"] }) {
  const className = "size-4";
  if (mode === "walking" || mode === "walk") return <FootprintsIcon className={className} />;
  if (mode === "bus") return <BusFrontIcon className={className} />;
  if (mode === "tram") return <TramFrontIcon className={className} />;
  if (mode === "cycle" || mode === "cycle-hire") return <BikeIcon className={className} />;
  return <TrainFrontIcon className={className} />;
}

interface Props {
  journeys: Journey[];
  savePayload?: SaveRoutePayload;
  isLoading?: boolean;
  userLocation?: { lat: number; lon: number } | null;
}

function SaveButton({ payload }: { payload: SaveRoutePayload }) {
  const { user } = useAuth();
  const { saveRoute } = useSavedRoutes();
  const [showAuth, setShowAuth] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function doSave() {
    setSaving(true);
    try {
      await saveRoute(payload, nickname);
      setSaved(true);
      setShowNickname(false);
      toast.success("Route saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save route");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-success/10 px-3 text-xs font-semibold text-success-foreground">
        <CheckIcon className="size-3.5" />
        Saved
      </span>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => (user ? setShowNickname(true) : setShowAuth(true))}
        disabled={saving}
      >
        <HeartIcon />
        {saving ? "Saving…" : "Save route"}
      </Button>

      <Dialog open={showNickname} onOpenChange={setShowNickname}>
        <DialogContent>
          <DialogHeader>
            <span className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HeartIcon className="size-5" />
            </span>
            <DialogTitle>Save this route</DialogTitle>
            <DialogDescription>
              {payload.fromStationName} → {payload.toStationName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="route-nickname">
              Nickname <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="route-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Morning commute"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") doSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNickname(false)}>Cancel</Button>
            <Button onClick={doSave} disabled={saving}>{saving ? "Saving…" : "Save route"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showAuth && (
        <AuthModal
          prompt="Sign in to save this route — it only takes a moment."
          onSuccess={() => {
            setShowAuth(false);
            setShowNickname(true);
          }}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}

export default function JourneyResults({ journeys, savePayload, isLoading, userLocation }: Props) {
  if (isLoading) {
    return (
      <div className="mt-10 space-y-5">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  if (journeys.length === 0) return null;

  return (
    <section className="mt-12 animate-enter" aria-labelledby="journey-results-title">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Your options</p>
          <h2 id="journey-results-title" className="mt-1 text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
            {journeys.length === 1 ? "1 route found" : `${journeys.length} routes found`}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">Times shown in local London time</p>
      </div>

      <div className="space-y-5">
        {journeys.map((journey, idx) => {
          const departure = formatTime(journey.departureTime);
          const arrival = formatTime(journey.arrivalTime);

          return (
            <Card
              key={idx}
              className={idx === 0 ? "relative rounded-3xl border-primary/30 shadow-[0_18px_50px_color-mix(in_oklch,var(--primary)_10%,transparent)]" : "rounded-3xl"}
            >
              {idx === 0 && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary/45" />}
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-5">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {idx === 0 ? (
                      <Badge className="bg-primary text-primary-foreground">
                        <SparklesIcon /> Fastest route
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Option {idx + 1}</Badge>
                    )}
                    <Badge variant="outline" className="tabular-nums">
                      <Clock3Icon /> {journey.duration} min
                    </Badge>
                    {formatFare(journey.fare) && (
                      <Badge variant="success" className="tabular-nums">{formatFare(journey.fare)}</Badge>
                    )}
                  </div>
                  {departure && arrival ? (
                    <div className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-[-0.035em] tabular-nums sm:text-3xl">
                      <span>{departure}</span>
                      <ArrowRightIcon className="size-5 text-muted-foreground" />
                      <span>{arrival}</span>
                    </div>
                  ) : (
                    <p className="text-xl font-bold tracking-[-0.025em]">Route option {idx + 1}</p>
                  )}
                </div>
                {savePayload && <SaveButton payload={savePayload} />}
              </CardHeader>

              <CardContent>
                <div className="grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
                  <Accordion defaultValue={idx === 0 ? ["steps"] : []}>
                    <AccordionItem value="steps" className="border-none">
                      <AccordionTrigger className="rounded-xl bg-muted/55 px-3.5 py-3 text-sm hover:no-underline">
                        <span className="flex items-center gap-2 font-semibold">
                          <MapPinnedIcon className="size-4 text-primary" />
                          {journey.legs.length === 1 ? "1 journey step" : `${journey.legs.length} journey steps`}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-0">
                        <ol>
                          {journey.legs.map((leg, li) => (
                            <li key={li} className="relative flex gap-3.5 pb-5 last:pb-1">
                              {li < journey.legs.length - 1 && (
                                <span className="absolute top-9 bottom-0 left-[17px] w-px bg-border" />
                              )}
                              <span className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl border ${MODE_STYLES[leg.mode] ?? "border-border bg-muted text-muted-foreground"}`}>
                                <LegIcon mode={leg.mode} />
                              </span>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                                    {MODE_LABELS[leg.mode] ?? leg.mode}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{leg.duration} min</span>
                                </div>
                                <div className="mt-1 text-sm leading-5 text-foreground">
                                  {leg.from && leg.to ? (
                                    <><span className="font-semibold">{leg.from}</span> <span className="text-muted-foreground">to</span> <span className="font-semibold">{leg.to}</span></>
                                  ) : (
                                    leg.instruction
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  {leg.lineName && leg.lineName !== leg.mode && <span className="font-medium text-foreground/75">{leg.lineName}</span>}
                                  {leg.departureTime && <span className="tabular-nums">{formatTime(leg.departureTime)} – {formatTime(leg.arrivalTime)}</span>}
                                </div>
                                {leg.instruction && leg.from && leg.instruction !== `${leg.from} to ${leg.to}` && (
                                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{leg.instruction}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <JourneyMap legs={journey.legs} userLocation={userLocation} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
