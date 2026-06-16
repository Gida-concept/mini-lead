"use client";

import { useState, useRef, useCallback } from "react";
import * as api from "@/lib/api";
import type { LeadSource } from "@/types/lead";
import type { ScrapeInput, ScrapeResponse } from "@/types/search";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_TIME_MS = 600_000; // 10 minutes max

interface UseScrapeReturn {
  trigger: (
    source: LeadSource,
    input: ScrapeInput,
    onComplete?: () => void,
  ) => Promise<ScrapeResponse>;
  isRunning: boolean;
  result: ScrapeResponse | null;
  error: string | null;
}

export function useScrape(): UseScrapeReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const trigger = async (
    source: LeadSource,
    input: ScrapeInput,
    onComplete?: () => void,
  ): Promise<ScrapeResponse> => {
    // Clean up any previous poll
    stopPolling();

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.scrapeSource(source, input);
      if (!response.success) {
        throw new Error("Scrape request failed");
      }

      const { searchId } = response.data;

      // Start polling the search status
      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        try {
          const statusResp = await api.getSearch(searchId);
          const search = statusResp.data;

          if (search.run_status === "completed" || search.run_status === "failed") {
            stopPolling();
            setIsRunning(false);

            if (search.run_status === "completed") {
              onComplete?.();
            } else {
              setError("Scrape job failed on the server");
            }
          }

          // Timeout safeguard
          if (Date.now() - startedAt > MAX_POLL_TIME_MS) {
            stopPolling();
            setIsRunning(false);
            setError("Scrape timed out");
          }
        } catch {
          // Poll error — keep trying
        }
      }, POLL_INTERVAL_MS);

      setResult(response.data);
      return response.data;
    } catch (err) {
      stopPolling();
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setIsRunning(false);
      throw err;
    }
  };

  return { trigger, isRunning, result, error };
}
