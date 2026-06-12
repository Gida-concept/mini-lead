"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryPreview } from "@/components/QueryPreview";
import { BUSINESS_TYPE_SUGGESTIONS, LOCATION_SUGGESTIONS, DEFAULTS } from "@/lib/constants";
import type { LeadSource } from "@/types/lead";
import type { ScrapeInput } from "@/types/search";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

interface SearchFormProps {
  source: LeadSource;
  onSubmit: (input: ScrapeInput) => Promise<void>;
  isRunning?: boolean;
  className?: string;
}

export function SearchForm({
  source,
  onSubmit,
  isRunning = false,
  className,
}: SearchFormProps) {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState<number>(DEFAULTS.maxResults);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessType.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a business type.",
        variant: "destructive",
      });
      return;
    }

    if (!location.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a location.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit({
        businessType: businessType.trim(),
        location: location.trim(),
        maxResults,
      });
      toast({
        title: "Search started",
        description: `Scraping ${source} for "${businessType}" in "${location}".`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Search failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="businessType">Business Type</Label>
          <Input
            id="businessType"
            list="businessTypeSuggestions"
            placeholder="e.g. Restaurant, Cafe, Hotel"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            disabled={isRunning}
            required
          />
          <datalist id="businessTypeSuggestions">
            {BUSINESS_TYPE_SUGGESTIONS.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            list="locationSuggestions"
            placeholder="e.g. Lagos, Nigeria"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isRunning}
            required
          />
          <datalist id="locationSuggestions">
            {LOCATION_SUGGESTIONS.map((loc) => (
              <option key={loc} value={loc} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxResults">Max Results</Label>
          <Input
            id="maxResults"
            type="number"
            min={1}
            max={200}
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            disabled={isRunning}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search & Scrape
            </>
          )}
        </Button>
      </div>

      <QueryPreview
        source={source}
        businessType={businessType}
        location={location}
        maxResults={maxResults}
      />
    </form>
  );
}
