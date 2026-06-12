"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type { SearchRecord } from "@/types/search";
import type { PaginationMeta } from "@/types/api";

interface UseSearchesReturn {
  searches: SearchRecord[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

export function useSearches(
  filters: { page?: number; limit?: number } = {}
): UseSearchesReturn {
  const [searches, setSearches] = useState<SearchRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.getSearches(filters);
      setSearches(response.data);
      setMeta(response.meta ?? null);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filters.page, filters.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { searches, meta, isLoading, isError, refetch: fetchData };
}
