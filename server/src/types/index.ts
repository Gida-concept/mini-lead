// ===== Lead Types =====

export interface Lead {
  id: number;
  source: 'google_maps';
  business_type: string;
  location: string;
  business_name: string | null;
  page_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  review_count: number | null;
  social_handle: string | null;
  description: string | null;
  raw_data: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'rejected';
  created_at: string;
  updated_at: string;
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
}

export interface LeadCreateInput {
  source: Lead['source'];
  business_type: string;
  location: string;
  business_name?: string | null;
  page_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  rating?: number | null;
  review_count?: number | null;
  social_handle?: string | null;
  description?: string | null;
  raw_data?: string | null;
  status?: Lead['status'];
}

export interface LeadUpdateInput {
  business_name?: string | null;
  page_url?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  rating?: number | null;
  review_count?: number | null;
  social_handle?: string | null;
  description?: string | null;
  raw_data?: string | null;
  status?: Lead['status'];
}

// ===== Search Types =====

export interface SearchRecord {
  id: number;
  source: string;
  query_params: string;
  results_count: number | null;
  run_status: 'running' | 'completed' | 'failed';
  apify_run_id: string | null;
  created_at: string;
}

export interface SearchCreateInput {
  source: string;
  query_params: string;
  run_status?: 'running' | 'completed' | 'failed';
}

// ===== Scrape Types =====

export interface ScrapeInput {
  businessType: string;
  location: string;
  maxResults?: number;
}

// ===== Stats Types =====

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
  recentSearches: SearchRecord[];
}

// ===== Export Types =====

export interface ExportRecord {
  id: number;
  filename: string | null;
  filter_source: string | null;
  record_count: number | null;
  created_at: string;
}

export interface ExportCreateInput {
  filename: string;
  filter_source: string;
  record_count: number;
}

// ===== Pagination =====

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ===== API Response Types =====

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: PaginationMeta;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}
