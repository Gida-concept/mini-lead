"use client";

import { useStats } from "@/hooks/useStats";
import { useSearches } from "@/hooks/useSearches";
import { useScrape } from "@/hooks/useScrape";
import { StatsCards } from "@/components/StatsCards";
import { RecentSearches } from "@/components/RecentSearches";
import { SearchForm } from "@/components/SearchForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SOURCES, SOURCE_LABELS } from "@/lib/constants";
import type { LeadSource } from "@/types/lead";
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

  const handleSearch = (source: LeadSource) => async (input: ScrapeInput) => {
    await triggerScrape(source, input);
    refetchSearches();
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
        <h2 className="text-lg font-semibold">Quick Search</h2>
        <Tabs defaultValue="facebook">
          <TabsList className="overflow-x-auto flex-nowrap w-full sm:w-auto">
            {SOURCES.map((source) => (
              <TabsTrigger key={source} value={source} className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
                {SOURCE_LABELS[source]}
              </TabsTrigger>
            ))}
          </TabsList>
          {SOURCES.map((source) => (
            <TabsContent key={source} value={source}>
              <SearchForm
                source={source}
                onSubmit={handleSearch(source)}
                isRunning={isRunning}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <RecentSearches
        searches={searches}
        isLoading={searchesLoading}
        isError={searchesError}
      />
    </div>
  );
}
