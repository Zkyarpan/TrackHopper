/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLineStatuses } from "@/lib/api";
import type { LineStatus } from "@/lib/types";

export function useLineStatus() {
  const [statuses, setStatuses] = useState<LineStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchLineStatuses()
      .then(setStatuses)
      .catch(() => setError("Could not load line status"))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { statuses, isLoading, error, refetch };
}
