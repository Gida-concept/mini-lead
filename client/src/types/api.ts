export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: ApiError;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface StatsOverview {
  totalLeads: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  withEmail: number;
  withPhone: number;
  withBoth: number;
}

export interface StatsRecent {
  last24h: {
    leadsAdded: number;
    searchesRun: number;
    exportsGenerated: number;
  };
  last7d: {
    leadsAdded: number;
    searchesRun: number;
    exportsGenerated: number;
  };
  recentSearches: import("./search").SearchRecord[];
}

export interface ExportRecord {
  id: number;
  filename: string;
  filter_source: string | null;
  record_count: number;
  created_at: string;
}

export interface LeadFilters {
  source?: string;
  location?: string;
  businessType?: string;
  status?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  minRating?: number;
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
