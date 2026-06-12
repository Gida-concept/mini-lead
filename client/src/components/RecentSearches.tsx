"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { SOURCE_LABELS } from "@/lib/constants";
import type { SearchRecord } from "@/types/search";

const statusColors: Record<string, string> = {
  running: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

interface RecentSearchesProps {
  searches: SearchRecord[] | null;
  isLoading: boolean;
  isError: boolean;
  onViewAll?: () => void;
}

export function RecentSearches({
  searches,
  isLoading,
  isError,
  onViewAll,
}: RecentSearchesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Searches</h2>
        <div className="rounded-md border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Searches</h2>
        <EmptyState variant="error" />
      </div>
    );
  }

  if (!searches || searches.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Searches</h2>
        <EmptyState variant="no-searches" />
      </div>
    );
  }

  const displaySearches = searches.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Recent Searches</h2>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        )}
      </div>

      {/* Desktop table */}
      <div className="rounded-md border hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Query</TableHead>
              <TableHead>Results</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displaySearches.map((search) => (
              <TableRow key={search.id}>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {SOURCE_LABELS[search.source] || search.source}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {search.query_params.businessType} in {search.query_params.location}
                </TableCell>
                <TableCell>
                  {search.results_count !== null ? search.results_count : "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      statusColors[search.run_status] || ""
                    }`}
                  >
                    {statusLabels[search.run_status] || search.run_status}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(search.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {displaySearches.map((search) => (
          <Card key={search.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="capitalize">
                {SOURCE_LABELS[search.source] || search.source}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(search.created_at)}
              </span>
            </div>
            <p className="text-sm font-medium truncate mb-2">
              {search.query_params.businessType} in {search.query_params.location}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {search.results_count !== null ? search.results_count : "—"} results
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  statusColors[search.run_status] || ""
                }`}
              >
                {statusLabels[search.run_status] || search.run_status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
