export type LeadSource = "google_maps";

export type LeadStatus = "new" | "contacted" | "qualified" | "rejected";

export interface Lead {
  id: number;
  source: LeadSource;
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
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadCreateInput {
  source: LeadSource;
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
  status?: LeadStatus;
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
  status?: LeadStatus;
}

export interface BulkStatusInput {
  ids: number[];
  status: LeadStatus;
}

export interface BulkDeleteInput {
  ids: number[];
}
