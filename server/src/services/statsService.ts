import { LeadModel } from '../models/Lead.js';
import { SearchModel } from '../models/Search.js';
import { ExportModel } from '../models/Export.js';
import type { StatsOverview, StatsRecent } from '../types/index.js';

export const statsService = {
  async getOverview(): Promise<StatsOverview> {
    return LeadModel.getStats();
  },

  async getRecent(): Promise<StatsRecent> {
    const leadStats = LeadModel.getRecentStats();
    const searchStats = SearchModel.getRecentStats();
    const exportStats = ExportModel.getRecentStats();
    const recentSearches = SearchModel.findRecent(5);

    return {
      last24h: {
        leadsAdded: leadStats.last24h,
        searchesRun: searchStats.last24h,
        exportsGenerated: exportStats.last24h,
      },
      last7d: {
        leadsAdded: leadStats.last7d,
        searchesRun: searchStats.last7d,
        exportsGenerated: exportStats.last7d,
      },
      recentSearches,
    };
  },
};
