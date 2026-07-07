"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { HeartIcon, CheckIcon } from "lucide-react";
import type { Journey, SaveRoutePayload } from "@/lib/types";
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
  loading: () => <Skeleton className="mt-3 h-[260px] w-full rounded-xl" />,
});

const MODE_LABELS: Record<string, string> = {
  tube: "Tube",
  bus: "Bus",
  walking: "Walk",
  walk: "Walk",
  "elizabeth-line": "Elizabeth",
  overground: "Overground",
  dlr: "DLR",
  tram: "Tram",
  "national-rail": "Rail",
  cycle: "Cycle",
  "cycle-hire": "Cycle",
};

function formatTime(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return iso;
  }
}

function formatFare(fare: number | null) {
  return fare === null ? null : `£${fare.toFixed(2)}`;
}

interface Props {
  journeys: Journey[];
  savePayload?: SaveRoutePayload;
  isLoading?: boolean;
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
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <CheckIcon className="h-3.5 w-3.5" />
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
        onClick={() => (user ? setShowNickname(true) : setShowAuth(true))}
        disabled={saving}
      >
        <HeartIcon />
        {saving ? "Saving…" : "Save route"}
      </Button>

      <Dialog open={showNickname} onOpenChange={setShowNickname}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this route</DialogTitle>
            <DialogDescription>
              {payload.fromStationName} → {payload.toStationName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="route-nickname">
              Nickname <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="route-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Morning commute"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") doSave(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNickname(false)}>Cancel</Button>
            <Button onClick={doSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showAuth && (
        <AuthModal
          prompt="Sign in to save this route — it only takes a moment."
          onSuccess={() => { setShowAuth(false); setShowNickname(true); }}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}

export default function JourneyResults({ journeys, savePayload, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (journeys.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-lg font-semibold">
        {journeys.length === 1 ? "1 route found" : `${journeys.length} routes found`}
      </h2>

      {journeys.map((journey, idx) => (
        <Card key={idx}>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {formatTime(journey.departureTime) && (
                <span className="font-medium text-foreground">
                  {formatTime(journey.departureTime)} → {formatTime(journey.arrivalTime)}
                </span>
              )}
              <Badge variant="secondary">{journey.duration} min</Badge>
              {formatFare(journey.fare) && (
                <Badge variant="outline" className="border-green-300 text-green-700 dark:text-green-400">
                  {formatFare(journey.fare)}
                </Badge>
              )}
              {idx === 0 && <span className="text-xs font-medium text-muted-foreground">Fastest</span>}
            </div>
            {savePayload && <SaveButton payload={savePayload} />}
          </CardHeader>

          <CardContent>
            <Accordion defaultValue={idx === 0 ? ["steps"] : []}>
              <AccordionItem value="steps" className="border-none">
                <AccordionTrigger className="py-1 text-sm text-muted-foreground hover:no-underline">
                  {journey.legs.length === 1 ? "1 step" : `${journey.legs.length} steps`}
                </AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-2">
                    {journey.legs.map((leg, li) => (
                      <li key={li} className="flex items-start gap-3 text-sm">
                        <div className="shrink-0 pt-0.5">
                          <Badge>{MODE_LABELS[leg.mode] ?? leg.mode}</Badge>
                        </div>
                        <div className="min-w-0">
                          <div className="text-foreground">
                            {leg.from && leg.to ? (
                              <>
                                <span className="font-medium">{leg.from}</span> → <span className="font-medium">{leg.to}</span>
                              </>
                            ) : (
                              leg.instruction
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {leg.lineName && leg.lineName !== leg.mode && <span>{leg.lineName}</span>}
                            <span>{leg.duration} min</span>
                            {leg.departureTime && (
                              <span>{formatTime(leg.departureTime)} – {formatTime(leg.arrivalTime)}</span>
                            )}
                          </div>
                          {leg.instruction && leg.from && leg.instruction !== `${leg.from} to ${leg.to}` && (
                            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                              {leg.instruction}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <JourneyMap legs={journey.legs} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
