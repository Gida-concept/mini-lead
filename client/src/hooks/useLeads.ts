"use client";

import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";
import type { LeadFilters } from "@/types/api";
import type {
  Lead,
  LeadSource,
  LeadStatus,
  BulkStatusInput,
  BulkDeleteInput,
  LeadUpdateInput,
} from "@/types/lead";
import type { PaginationMeta } from "@/types/api";

interface UseLeadsReturn {
  leads: Lead[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
}

interface UseLeadReturn {
  lead: Lead | null;
  isLoading: boolean;
  isError: boolean;
}

export function useLeads(filters: LeadFilters = {}): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const response = await api.getLeads(filters);
      setLeads(response.data);
      setMeta(response.meta ?? null);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error("Failed to load leads"));
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.source,
    filters.location,
    filters.businessType,
    filters.status,
    filters.q,
    filters.page,
    filters.limit,
    filters.sortBy,
    filters.sortOrder,
    filters.hasEmail,
    filters.hasPhone,
    filters.minRating,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { leads, meta, isLoading, isError, error, mutate: fetchData };
}

export function useLead(id: number): UseLeadReturn {
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.getLead(id);
      setLead(response.data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  return { lead, isLoading, isError };
}

export function useUpdateLead() {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const updateLead = async (id: number, input: LeadUpdateInput) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.updateLead(id, input);
      return response.data;
    } catch {
      setIsError(true);
      throw new Error("Failed to update lead");
    } finally {
      setIsLoading(false);
    }
  };

  return { updateLead, isLoading, isError };
}

export function useDeleteLead() {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const deleteLead = async (id: number) => {
    setIsLoading(true);
    setIsError(false);
    try {
      await api.deleteLead(id);
    } catch {
      setIsError(true);
      throw new Error("Failed to delete lead");
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteLead, isLoading, isError };
}

export function useBulkStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const bulkStatus = async (input: BulkStatusInput) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.bulkUpdateStatus(input);
      return response.data;
    } catch {
      setIsError(true);
      throw new Error("Failed to update statuses");
    } finally {
      setIsLoading(false);
    }
  };

  return { bulkStatus, isLoading, isError };
}

export function useBulkDelete() {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const bulkDelete = async (input: BulkDeleteInput) => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await api.bulkDelete(input);
      return response.data;
    } catch {
      setIsError(true);
      throw new Error("Failed to delete leads");
    } finally {
      setIsLoading(false);
    }
  };

  return { bulkDelete, isLoading, isError };
}
