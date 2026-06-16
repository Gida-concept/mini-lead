"use client";

import { useStats } from "@/hooks/useStats";
import { useSearches } from "@/hooks/useSearches";
import { useScrape } from "@/hooks/useScrape";
import { StatsCards } from "@/components/StatsCards";
import { RecentSearches } from "@/components/RecentSearches";
import { SearchForm } from "@/components/SearchForm";
import type { ScrapeInput } from "@/types/search";

export default function DashboardPage() {
  const { stats, recent, isLoading: statsLoading, isError: statsError } = useStats();
  const {
    searches,
    isLoading: searchesLoading,
    isError: searchesError,
    refetch: refetchSearches,
  } = useSearches();
  const { trigger: triggerScrape, isRunning } = useScrape();

  const handleSearch = async (input: ScrapeInput) => {
    await triggerScrape("google_maps", input, refetchSearches);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your lead generation activity.
        </p>
      </div>

      <StatsCards
        stats={
          stats
            ? {
                totalLeads: stats.totalLeads,
                withEmail: stats.withEmail,
                withPhone: stats.withPhone,
                newToday: recent?.last24h.leadsAdded ?? 0,
              }
            : null
        }
        isLoading={statsLoading}
        isError={statsError}
      />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Search — Google Maps</h2>
        <SearchForm
          source="google_maps"
          onSubmit={handleSearch}
          isRunning={isRunning}
        />
      </div>

      <RecentSearches
        searches={searches}
        isLoading={searchesLoading}
        isError={searchesError}
      />
    </div>
  );
}
