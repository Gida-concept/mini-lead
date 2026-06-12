import { LeadModel } from '../models/Lead.js';
import { AppError } from '../utils/AppError.js';
import type {
  Lead,
  LeadCreateInput,
  LeadFilters,
  LeadUpdateInput,
  PaginationMeta,
} from '../types/index.js';

export const leadService = {
  async bulkInsertFromScrape(
    leads: LeadCreateInput[],
    source: string,
  ): Promise<number> {
    if (leads.length === 0) return 0;

    let inserted = 0;

    for (const leadInput of leads) {
      // Ensure source is set
      leadInput.source = source as LeadCreateInput['source'];

      // Check for dedup: same page_url + source
      if (leadInput.page_url) {
        const existing = LeadModel.findByUrlAndSource(leadInput.page_url, source);

        if (existing) {
          // Merge: only fill null fields in existing record with incoming non-null values
          const updates: LeadUpdateInput = {};

          if (!existing.business_name && leadInput.business_name) {
            updates.business_name = leadInput.business_name;
          }
          if (!existing.email && leadInput.email) {
            updates.email = leadInput.email;
          }
          if (!existing.phone && leadInput.phone) {
            updates.phone = leadInput.phone;
          }
          if (!existing.address && leadInput.address) {
            updates.address = leadInput.address;
          }
          if (existing.rating === null && leadInput.rating !== null) {
            updates.rating = leadInput.rating;
          }
          if (existing.review_count === null && leadInput.review_count !== null) {
            updates.review_count = leadInput.review_count;
          }
          if (!existing.social_handle && leadInput.social_handle) {
            updates.social_handle = leadInput.social_handle;
          }
          if (!existing.description && leadInput.description) {
            updates.description = leadInput.description;
          }
          if (!existing.page_url && leadInput.page_url) {
            updates.page_url = leadInput.page_url;
          }

          // Always update raw_data if provided
          if (leadInput.raw_data) {
            updates.raw_data = leadInput.raw_data;
          }

          if (Object.keys(updates).length > 0) {
            LeadModel.update(existing.id, updates);
          }

          continue;
        }
      }

      // Insert new lead
      LeadModel.create(leadInput);
      inserted++;
    }

    return inserted;
  },

  async getLeads(
    filters: LeadFilters,
    pagination: { page: number; limit: number },
    sort: { sortBy: string; sortOrder: string },
  ): Promise<{ data: Lead[]; meta: PaginationMeta }> {
    return LeadModel.findAll(filters, pagination, sort);
  },

  async getLead(id: number): Promise<Lead> {
    const lead = LeadModel.findById(id);
    if (!lead) {
      throw new AppError(404, 'NOT_FOUND', `Lead with id ${id} not found`);
    }
    return lead;
  },

  async createLead(input: LeadCreateInput): Promise<Lead> {
    return LeadModel.create(input);
  },

  async updateLead(id: number, input: LeadUpdateInput): Promise<Lead> {
    const lead = LeadModel.update(id, input);
    if (!lead) {
      throw new AppError(404, 'NOT_FOUND', `Lead with id ${id} not found`);
    }
    return lead;
  },

  async deleteLead(id: number): Promise<boolean> {
    const deleted = LeadModel.delete(id);
    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', `Lead with id ${id} not found`);
    }
    return true;
  },

  async bulkUpdateStatus(ids: number[], status: string): Promise<number> {
    if (ids.length === 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'ids array must not be empty');
    }
    return LeadModel.bulkUpdateStatus(ids, status);
  },

  async bulkDelete(ids?: number[], filter?: LeadFilters): Promise<number> {
    if (ids && ids.length > 0) {
      return LeadModel.bulkDeleteByIds(ids);
    }
    if (filter) {
      const deleted = LeadModel.bulkDeleteByFilter(filter);
      return deleted;
    }
    throw new AppError(400, 'VALIDATION_ERROR', 'Provide ids array or filter object');
  },
};
