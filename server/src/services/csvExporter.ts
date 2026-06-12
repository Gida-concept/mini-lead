import { Response } from 'express';
import { format } from 'fast-csv';
import { LeadModel } from '../models/Lead.js';
import { ExportModel } from '../models/Export.js';
import { AppError } from '../utils/AppError.js';
import type { LeadFilters } from '../types/index.js';

function formatDateForFilename(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}-${h}${min}${s}`;
}

export async function exportCsv(filters: LeadFilters, res: Response): Promise<void> {
  // Get all matching leads (unpaginated, default sort by created_at desc)
  const { data: leads } = LeadModel.findAll(
    filters,
    { page: 1, limit: 100000 },
    { sortBy: 'created_at', sortOrder: 'desc' },
  );

  if (leads.length === 0) {
    throw new AppError(400, 'EXPORT_EMPTY', 'No leads match the specified filters');
  }

  const source = filters.source || 'all';
  const timestamp = formatDateForFilename();
  const filename = `leads-${source}-${timestamp}.csv`;

  const csvStream = format({ headers: true });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  csvStream.pipe(res);

  for (const lead of leads) {
    csvStream.write({
      id: lead.id,
      business_type: lead.business_type,
      location: lead.location,
      business_name: lead.business_name || '',
      page_url: lead.page_url || '',
      email: lead.email || '',
      phone: lead.phone || '',
      address: lead.address || '',
      rating: lead.rating ?? '',
      review_count: lead.review_count ?? '',
      social_handle: lead.social_handle || '',
      description: lead.description || '',
      source: lead.source,
      status: lead.status,
      created_at: lead.created_at,
    });
  }

  csvStream.end();

  // Save export record after stream completes
  ExportModel.create({
    filename,
    filter_source: source,
    record_count: leads.length,
  });
}
