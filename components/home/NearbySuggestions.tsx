"use client";

// Shown after the user grants location: up to 5 nearby TfL stations
// (tappable -> set as "from"), plus any saved routes whose origin is
// among those nearby stations, surfaced as quick-picks.

import { useMemo } from "react";
import { MapPinIcon, BookmarkIcon } from "lucide-react";
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
      <Card>
        <CardContent className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Nearby stations</p>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (stations.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-3">
        {savedMatches.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Continue a saved route</p>
            <div className="space-y-1">
              {savedMatches.map((r) => (
                <Button
                  key={r.id}
                  type="button"
                  variant="secondary"
                  className="w-full justify-start gap-2 text-left"
                  onClick={() =>
                    onRunSavedRoute(
                      { id: r.from_station_id, name: r.from_station_name, modes: [] },
                      { id: r.to_station_id, name: r.to_station_name, modes: [] }
                    )
                  }
                >
                  <BookmarkIcon className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{r.nickname ?? `${r.from_station_name} → ${r.to_station_name}`}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Nearby stations</p>
          <div className="flex flex-wrap gap-1.5">
            {stations.map((s) => {
              const distance = (s as StationMatch & { distance?: number }).distance;
              return (
                <Button
                  key={s.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => onSelectFrom(s)}
                >
                  <MapPinIcon className="text-muted-foreground" />
                  {s.name}
                  {distance != null && (
                    <Badge variant="outline" className="ml-0.5">{formatDistance(distance)}</Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
