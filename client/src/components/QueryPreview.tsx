"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadSource } from "@/types/lead";
import { SOURCE_LABELS } from "@/lib/constants";

interface QueryPreviewProps {
  source: LeadSource;
  businessType: string;
  location: string;
  maxResults: number;
  className?: string;
}

function buildQueryString(
  source: LeadSource,
  businessType: string,
  location: string
): string {
  const bt = businessType || "[business type]";
  const loc = location || "[location]";

  switch (source) {
    case "facebook":
      return `site:facebook.com/pages "${bt}" "${loc}"`;
    case "instagram":
      return `site:instagram.com "${bt}" "${loc}"`;
    case "google_web":
      return `"${bt}" "${loc}"`;
    case "google_maps":
      return `${bt} in ${loc}`;
  }
}

export function QueryPreview({
  source,
  businessType,
  location,
  maxResults,
  className,
}: QueryPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  const queryString = buildQueryString(source, businessType, location);

  return (
    <div
      className={cn(
        "rounded-md border bg-muted/30 text-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Search className="h-4 w-4" />
        <span>Query preview — {SOURCE_LABELS[source]}</span>
      </button>
      {expanded && (
        <div className="border-t px-3 py-3 space-y-2">
          <div className="rounded bg-background p-2 font-mono text-xs">
            <div className="text-muted-foreground mb-1">
              {/* Apify actor query */}
              <span className="text-primary font-semibold">Actor:</span>{" "}
              {source === "google_maps"
                ? "leadsbrary/google-maps-email-extractor"
                : "apify/google-search-scraper"}
            </div>
            <div>
              <span className="text-primary font-semibold">Search:</span>{" "}
              {queryString}
            </div>
            <div>
              <span className="text-primary font-semibold">Max results:</span>{" "}
              {maxResults}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
