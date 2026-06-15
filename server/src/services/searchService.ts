import { SearchModel } from '../models/Search.js';
import { AppError } from '../utils/AppError.js';
import type { SearchRecord, SearchCreateInput, PaginationMeta } from '../types/index.js';

export const searchService = {
  async createSearch(input: SearchCreateInput): Promise<SearchRecord> {
    return await SearchModel.create(input);
  },

  async updateSearch(
    id: number,
    status: 'running' | 'completed' | 'failed',
    resultsCount?: number,
  ): Promise<SearchRecord> {
    const search = await SearchModel.updateStatus(id, status, resultsCount);
    if (!search) {
      throw new AppError(404, 'NOT_FOUND', `Search with id ${id} not found`);
    }
    return search;
  },

  async getSearches(
    pagination: { page: number; limit: number },
  ): Promise<{ data: SearchRecord[]; meta: PaginationMeta }> {
    return await SearchModel.findAll(pagination);
  },

  async getSearch(id: number): Promise<SearchRecord> {
    const search = await SearchModel.findById(id);
    if (!search) {
      throw new AppError(404, 'NOT_FOUND', `Search with id ${id} not found`);
    }
    return search;
  },
};
