/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { SavedRoute, SaveRoutePayload } from "@/lib/types";

export function useSavedRoutes() {
  const { user, loading: authLoading } = useAuth();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  // Start false — we don't know we need to load until auth resolves
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setSavedRoutes([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("saved_routes")
      .select("*")
      .order("created_at", { ascending: false });
    setIsLoading(false);
    if (dbError) {
      // Ignore "no rows" as an error — it's a valid empty state
      if (dbError.code !== "PGRST116") {
        setError(dbError.message);
      }
    } else {
      setSavedRoutes(data ?? []);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const saveRoute = useCallback(
    async (payload: SaveRoutePayload, nickname?: string) => {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not signed in");
      const { error: dbError } = await supabase.from("saved_routes").insert({
        user_id: currentUser.id,
        from_station_id: payload.fromStationId,
        from_station_name: payload.fromStationName,
        to_station_id: payload.toStationId,
        to_station_name: payload.toStationName,
        nickname: nickname?.trim() || null,
      });
      if (dbError) throw new Error(dbError.message);
      await refetch();
    },
    [refetch]
  );

  const deleteRoute = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error: dbError } = await supabase.from("saved_routes").delete().eq("id", id);
    if (dbError) throw new Error(dbError.message);
    setSavedRoutes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Combined loading: either auth is still resolving, or we're actively fetching routes
  const loading = authLoading || isLoading;

  return { savedRoutes, isLoading: loading, error, saveRoute, deleteRoute, refetch };
}
