"use client";

// Shown after the user grants location: up to 5 nearby TfL stations
// (tappable -> set as "from"), plus any saved routes whose origin is
// among those nearby stations, surfaced as quick-picks.

import { useMemo } from "react";
import { ArrowRightIcon, BookmarkIcon, MapPinIcon, NavigationIcon } from "lucide-react";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import type { StationMatch } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  stations: StationMatch[];
  isLoading: boolean;
  onSelectFrom: (station: StationMatch) => void;
  onRunSavedRoute: (from: StationMatch, to: StationMatch) => void;
}

function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

export default function NearbySuggestions({ stations, isLoading, onSelectFrom, onRunSavedRoute }: Props) {
  const { savedRoutes } = useSavedRoutes();

  const savedMatches = useMemo(() => {
    const nearbyIds = new Set(stations.map((s) => s.id));
    return savedRoutes.filter((r) => nearbyIds.has(r.from_station_id)).slice(0, 3);
  }, [stations, savedRoutes]);

  if (isLoading) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="space-y-3">
          <p className="text-sm font-semibold">Finding stations near you</p>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (stations.length === 0) return null;

  return (
    <Card className="rounded-3xl bg-card/90">
      <CardContent>
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success-foreground">
            <NavigationIcon className="size-4.5" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-[-0.015em]">Start from where you are</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose a nearby station or pick up a saved route.</p>
          </div>
        </div>

        <div className={savedMatches.length > 0 ? "grid gap-6 lg:grid-cols-[0.9fr_1.1fr]" : ""}>
        {savedMatches.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Continue a saved route</p>
            <div className="space-y-2">
              {savedMatches.map((r) => (
                <Button
                  key={r.id}
                  type="button"
                  variant="secondary"
                  className="h-auto min-h-11 w-full justify-start gap-2.5 px-3.5 py-2.5 text-left whitespace-normal"
                  onClick={() =>
                    onRunSavedRoute(
                      { id: r.from_station_id, name: r.from_station_name, modes: [] },
                      { id: r.to_station_id, name: r.to_station_name, modes: [] }
                    )
                  }
                >
                  <BookmarkIcon className="shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{r.nickname ?? `${r.from_station_name} → ${r.to_station_name}`}</span>
                  <ArrowRightIcon className="shrink-0 text-muted-foreground" />
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Nearby stations</p>
          <div className="flex flex-wrap gap-2">
            {stations.map((s) => {
              const distance = (s as StationMatch & { distance?: number }).distance;
              return (
                <Button
                  key={s.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-9 max-w-full rounded-full px-3 py-1.5"
                  onClick={() => onSelectFrom(s)}
                >
                  <MapPinIcon className="text-muted-foreground" />
                  <span className="truncate">{s.name}</span>
                  {distance != null && (
                    <Badge variant="secondary" className="ml-0.5 h-5">{formatDistance(distance)}</Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}
