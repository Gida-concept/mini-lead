"use client";

import { useState } from "react";
import * as api from "@/lib/api";
import type { LeadFilters } from "@/types/api";

interface UseExportReturn {
  exportData: (format: "csv" | "json", filters?: LeadFilters) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useExport(): UseExportReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async (format: "csv" | "json", filters: LeadFilters = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      if (format === "csv") {
        response = await api.exportCsv(filters);
      } else {
        response = await api.exportJson(filters);
      }

      if (response.success && response.data.url) {
        // Trigger browser download and clean up blob URL
        const a = document.createElement("a");
        a.href = response.data.url;
        a.download = response.data.url.split("/").pop() || `leads.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(response.data.url);
      } else {
        throw new Error("Export response missing download URL");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export data";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { exportData, isLoading, error };
}
