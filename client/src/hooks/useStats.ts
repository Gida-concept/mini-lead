"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type { StatsOverview, StatsRecent } from "@/types/api";

interface UseStatsReturn {
  stats: StatsOverview | null;
  recent: StatsRecent | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [recent, setRecent] = useState<StatsRecent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [overviewRes, recentRes] = await Promise.all([
        api.getStatsOverview(),
        api.getStatsRecent(),
      ]);
      if (overviewRes.success) setStats(overviewRes.data);
      if (recentRes.success) setRecent(recentRes.data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { stats, recent, isLoading, isError, refetch: fetchData };
}
