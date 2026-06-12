import type { LeadSource } from "./lead";

export type SearchRunStatus = "running" | "completed" | "failed";

export interface SearchRecord {
  id: number;
  source: LeadSource;
  query_params: ScrapeInput;
  results_count: number | null;
  run_status: SearchRunStatus;
  apify_run_id: string | null;
  created_at: string;
}

export interface ScrapeInput {
  businessType: string;
  location: string;
  maxResults: number;
}

export interface ScrapeResponse {
  searchId: number;
  source: LeadSource;
  status: SearchRunStatus;
  message: string;
  estimatedTimeSeconds: number;
}

export interface SearchFilters {
  page?: number;
  limit?: number;
}
