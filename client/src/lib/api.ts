import axios from "axios";
import type {
  ApiResponse,
  PaginatedResponse,
  StatsOverview,
  StatsRecent,
  LeadFilters,
  ExportRecord,
} from "@/types/api";
import type {
  Lead,
  LeadSource,
  LeadStatus,
  LeadCreateInput,
  LeadUpdateInput,
  BulkStatusInput,
  BulkDeleteInput,
} from "@/types/lead";
import type {
  SearchRecord,
  ScrapeInput,
  ScrapeResponse,
} from "@/types/search";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function getLeads(
  filters: LeadFilters = {}
): Promise<PaginatedResponse<Lead>> {
  const response = await apiClient.get("/api/leads", { params: filters });
  return response.data;
}

export async function getLead(id: number): Promise<ApiResponse<Lead>> {
  const response = await apiClient.get(`/api/leads/${id}`);
  return response.data;
}

export async function createLead(
  input: LeadCreateInput
): Promise<ApiResponse<Lead>> {
  const response = await apiClient.post("/api/leads", input);
  return response.data;
}

export async function updateLead(
  id: number,
  input: LeadUpdateInput
): Promise<ApiResponse<Lead>> {
  const response = await apiClient.patch(`/api/leads/${id}`, input);
  return response.data;
}

export async function deleteLead(
  id: number
): Promise<ApiResponse<{ deleted: boolean }>> {
  const response = await apiClient.delete(`/api/leads/${id}`);
  return response.data;
}

export async function bulkUpdateStatus(
  input: BulkStatusInput
): Promise<ApiResponse<{ updated: number; status: LeadStatus }>> {
  const response = await apiClient.post("/api/leads/bulk-status", input);
  return response.data;
}

export async function bulkDelete(
  input: BulkDeleteInput
): Promise<ApiResponse<{ deleted: number }>> {
  const response = await apiClient.post("/api/leads/bulk-delete", input);
  return response.data;
}

// ---------------------------------------------------------------------------
// Scraping
// ---------------------------------------------------------------------------

export async function scrapeSource(
  source: LeadSource,
  input: ScrapeInput
): Promise<ApiResponse<ScrapeResponse>> {
  const response = await apiClient.post(`/api/scrape/${source}`, input);
  return response.data;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export async function exportCsv(
  filters: LeadFilters = {}
): Promise<ApiResponse<{ url: string }>> {
  const response = await apiClient.get("/api/export/csv", {
    params: filters,
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  return { success: true, data: { url } };
}

export async function exportJson(
  filters: LeadFilters = {}
): Promise<ApiResponse<{ url: string }>> {
  const response = await apiClient.get("/api/export/json", {
    params: filters,
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  return { success: true, data: { url } };
}

export async function getExports(): Promise<ApiResponse<ExportRecord[]>> {
  const response = await apiClient.get("/api/exports");
  return response.data;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getStatsOverview(): Promise<ApiResponse<StatsOverview>> {
  const response = await apiClient.get("/api/stats/overview");
  return response.data;
}

export async function getStatsRecent(): Promise<ApiResponse<StatsRecent>> {
  const response = await apiClient.get("/api/stats/recent");
  return response.data;
}

// ---------------------------------------------------------------------------
// Searches
// ---------------------------------------------------------------------------

export async function getSearches(
  filters: { page?: number; limit?: number } = {}
): Promise<PaginatedResponse<SearchRecord>> {
  const response = await apiClient.get("/api/searches", { params: filters });
  return response.data;
}

export async function getSearch(
  id: number
): Promise<ApiResponse<SearchRecord>> {
  const response = await apiClient.get(`/api/searches/${id}`);
  return response.data;
}
