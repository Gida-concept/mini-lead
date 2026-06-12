"use client";

import { useState } from "react";
import * as api from "@/lib/api";
import type { LeadSource } from "@/types/lead";
import type { ScrapeInput, ScrapeResponse } from "@/types/search";

interface UseScrapeReturn {
  trigger: (source: LeadSource, input: ScrapeInput) => Promise<ScrapeResponse>;
  isRunning: boolean;
  result: ScrapeResponse | null;
  error: string | null;
}

export function useScrape(): UseScrapeReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trigger = async (
    source: LeadSource,
    input: ScrapeInput
  ): Promise<ScrapeResponse> => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.scrapeSource(source, input);
      if (!response.success) {
        throw new Error("Scrape request failed");
      }
      setResult(response.data);
      return response.data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      throw err;
    } finally {
      setIsRunning(false);
    }
  };

  return { trigger, isRunning, result, error };
}
