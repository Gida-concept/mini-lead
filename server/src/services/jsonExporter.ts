import { Response } from 'express';
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

export async function exportJson(filters: LeadFilters, res: Response): Promise<void> {
  // Get all matching leads (unpaginated)
  const { data: leads } = await LeadModel.findAll(
    filters,
    { page: 1, limit: 100000 },
    { sortBy: 'created_at', sortOrder: 'desc' },
  );

  if (leads.length === 0) {
    throw new AppError(400, 'EXPORT_EMPTY', 'No leads match the specified filters');
  }

  const source = filters.source || 'all';
  const timestamp = formatDateForFilename();
  const filename = `leads-${source}-${timestamp}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Pretty-print JSON array
  res.end(JSON.stringify(leads, null, 2));

  // Save export record
  await ExportModel.create({
    filename,
    filter_source: source,
    record_count: leads.length,
  });
}
