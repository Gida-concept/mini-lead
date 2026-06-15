import { LeadModel } from '../models/Lead.js';
import { SearchModel } from '../models/Search.js';
import { ExportModel } from '../models/Export.js';
import type { StatsOverview, StatsRecent } from '../types/index.js';

export const statsService = {
  async getOverview(): Promise<StatsOverview> {
    return await LeadModel.getStats();
  },

  async getRecent(): Promise<StatsRecent> {
    const leadStats = await LeadModel.getRecentStats();
    const searchStats = await SearchModel.getRecentStats();
    const exportStats = await ExportModel.getRecentStats();
    const recentSearches = await SearchModel.findRecent(5);

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
