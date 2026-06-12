"use client";

import { useState, useCallback } from "react";
import { AlertCircle, SearchX } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { SearchForm } from "@/components/SearchForm";
import { FilterBar } from "@/components/FilterBar";
import { LeadTable } from "@/components/LeadTable";
import { LeadCard } from "@/components/LeadCard";
import { LeadDetailModal } from "@/components/LeadDetailModal";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ExportButton } from "@/components/ExportButton";
import { Pagination } from "@/components/Pagination";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  useLeads,
  useUpdateLead,
  useDeleteLead,
  useBulkStatus,
  useBulkDelete,
} from "@/hooks/useLeads";
import { useScrape } from "@/hooks/useScrape";
import { useExport } from "@/hooks/useExport";
import { useToast } from "@/hooks/useToast";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { Lead, LeadSource, LeadStatus } from "@/types/lead";
import type { ScrapeInput } from "@/types/search";
import type { LeadFilters } from "@/types/api";

const SOURCE: LeadSource = "facebook";

export default function FacebookPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<LeadFilters>({
    source: SOURCE,
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: "created_at",
    sortOrder: "desc",
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    leads,
    meta,
    isLoading,
    isError,
    error,
    mutate: refetchLeads,
  } = useLeads(filters);
  const { updateLead } = useUpdateLead();
  const { deleteLead } = useDeleteLead();
  const { bulkStatus } = useBulkStatus();
  const { bulkDelete } = useBulkDelete();
  const { trigger: triggerScrape, isRunning: scrapeRunning } = useScrape();
  const { exportData } = useExport();

  const handleSearch = useCallback(
    async (input: ScrapeInput) => {
      await triggerScrape(SOURCE, input);
      refetchLeads();
    },
    [triggerScrape, refetchLeads]
  );

  const handleStatusChange = useCallback(
    async (id: number, status: LeadStatus) => {
      await updateLead(id, { status });
      toast({
        title: "Status updated",
        description: `Lead status changed to ${status}.`,
        variant: "success",
      });
      refetchLeads();
    },
    [updateLead, toast, refetchLeads]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await deleteLead(id);
      toast({
        title: "Lead deleted",
        description: "Lead has been removed.",
        variant: "success",
      });
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      refetchLeads();
    },
    [deleteLead, toast, refetchLeads]
  );

  const handleBulkStatus = useCallback(
    async (status: LeadStatus) => {
      await bulkStatus({ ids: selectedIds, status });
      toast({
        title: "Statuses updated",
        description: `${selectedIds.length} leads updated to ${status}.`,
        variant: "success",
      });
      setSelectedIds([]);
      refetchLeads();
    },
    [bulkStatus, selectedIds, toast, refetchLeads]
  );

  const handleBulkDelete = useCallback(async () => {
    await bulkDelete({ ids: selectedIds });
    toast({
      title: "Leads deleted",
      description: `${selectedIds.length} leads removed.`,
      variant: "success",
    });
    setSelectedIds([]);
    refetchLeads();
  }, [bulkDelete, selectedIds, toast, refetchLeads]);

  const handleExport = useCallback(
    async (format: "csv" | "json") => {
      await exportData(format, { source: SOURCE, status: filters.status, q: filters.q });
    },
    [exportData, filters.status, filters.q]
  );

  const handleSort = useCallback(
    (field: string, dir: "asc" | "desc") => {
      setFilters((prev) => ({ ...prev, sortBy: field, sortOrder: dir, page: 1 }));
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader source={SOURCE} leadCount={meta?.total} />
        <ExportButton onExport={handleExport} />
      </div>

      <SearchForm
        source={SOURCE}
        onSubmit={handleSearch}
        isRunning={scrapeRunning}
      />

      <FilterBar
        selectedStatus={(filters.status as LeadStatus | "all") || "all"}
        searchQuery={filters.q || ""}
        onStatusChange={(status) =>
          setFilters((prev) => ({
            ...prev,
            status: status === "all" ? undefined : status,
            page: 1,
          }))
        }
        onSearchChange={(q) =>
          setFilters((prev) => ({ ...prev, q: q || undefined, page: 1 }))
        }
      />

      {/* Desktop table */}
      <div className="hidden sm:block">
        <LeadTable
          leads={leads}
          isLoading={isLoading}
          isError={isError}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
          onSort={handleSort as any}
          sortField={(filters.sortBy as any) || "created_at"}
          sortDir={(filters.sortOrder as any) || "desc"}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onViewDetails={(lead) => {
            setDetailLead(lead);
            setDetailOpen(true);
          }}
          onRetry={refetchLeads}
          onClearFilters={() =>
            setFilters({ source: SOURCE, page: 1, limit: DEFAULT_PAGE_SIZE })
          }
        />
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          <LoadingState variant="cards" rows={3} />
        ) : isError ? (
          <EmptyState
            icon={AlertCircle}
            title="Failed to load leads"
            description={error?.message || "An unexpected error occurred."}
            action={
              <Button variant="outline" onClick={refetchLeads}>
                Retry
              </Button>
            }
          />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No leads found"
            description={
              filters.q || filters.status
                ? "Try adjusting your filters"
                : "Run a search to get started"
            }
            action={
              filters.q || filters.status ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      source: SOURCE,
                      page: 1,
                      limit: DEFAULT_PAGE_SIZE,
                    })
                  }
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onViewDetails={(l) => {
                setDetailLead(l);
                setDetailOpen(true);
              }}
            />
          ))
        )}
      </div>

      {meta && (
        <Pagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}

      <BulkActionsBar
        selectedCount={selectedIds.length}
        onBulkStatus={handleBulkStatus}
        onBulkDelete={handleBulkDelete}
      />

      <LeadDetailModal
        lead={detailLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
