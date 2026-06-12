import { db } from '../config/database.js';
import type {
  Lead,
  LeadFilters,
  LeadCreateInput,
  LeadUpdateInput,
  PaginationMeta,
} from '../types/index.js';

const ALLOWED_SORT_COLUMNS = new Set([
  'id', 'source', 'business_type', 'location', 'business_name',
  'page_url', 'email', 'phone', 'address', 'rating', 'review_count',
  'social_handle', 'status', 'created_at', 'updated_at',
]);

const ALLOWED_SORT_ORDERS = new Set(['asc', 'desc']);

function sanitizeSortBy(sortBy: string): string {
  return ALLOWED_SORT_COLUMNS.has(sortBy) ? sortBy : 'created_at';
}

function sanitizeSortOrder(sortOrder: string): string {
  return ALLOWED_SORT_ORDERS.has(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';
}

function buildWhereClause(
  filters: LeadFilters,
): { whereClauses: string[]; params: unknown[] } {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters.source) {
    whereClauses.push('source = ?');
    params.push(filters.source);
  }

  if (filters.location) {
    whereClauses.push('location LIKE ?');
    params.push(`%${filters.location}%`);
  }

  if (filters.businessType) {
    whereClauses.push('business_type LIKE ?');
    params.push(`%${filters.businessType}%`);
  }

  if (filters.status) {
    whereClauses.push('status = ?');
    params.push(filters.status);
  }

  if (filters.hasEmail === true) {
    whereClauses.push('email IS NOT NULL AND email != \'\'');
  }

  if (filters.hasPhone === true) {
    whereClauses.push('phone IS NOT NULL AND phone != \'\'');
  }

  if (filters.minRating !== undefined && filters.minRating !== null) {
    whereClauses.push('rating >= ?');
    params.push(filters.minRating);
  }

  if (filters.q) {
    whereClauses.push(
      '(business_name LIKE ? OR description LIKE ? OR address LIKE ?)',
    );
    const q = `%${filters.q}%`;
    params.push(q, q, q);
  }

  return { whereClauses, params };
}

function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as number,
    source: row.source as Lead['source'],
    business_type: row.business_type as string,
    location: row.location as string,
    business_name: (row.business_name as string) ?? null,
    page_url: (row.page_url as string) ?? null,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    address: (row.address as string) ?? null,
    rating: (row.rating as number) ?? null,
    review_count: (row.review_count as number) ?? null,
    social_handle: (row.social_handle as string) ?? null,
    description: (row.description as string) ?? null,
    raw_data: (row.raw_data as string) ?? null,
    status: row.status as Lead['status'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export const LeadModel = {
  findAll(
    filters: LeadFilters,
    pagination: { page: number; limit: number },
    sort: { sortBy: string; sortOrder: string },
  ): { data: Lead[]; meta: PaginationMeta } {
    const { whereClauses, params } = buildWhereClause(filters);
    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sortBy = sanitizeSortBy(sort.sortBy);
    const sortOrder = sanitizeSortOrder(sort.sortOrder);

    const page = Math.max(1, pagination.page);
    const limit = Math.min(100, Math.max(1, pagination.limit));
    const offset = (page - 1) * limit;

    // Count query
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM leads ${whereSQL}`);
    const countRow = countStmt.get(...params) as { total: number };
    const total = countRow.total;

    // Data query
    const dataStmt = db.prepare(
      `SELECT * FROM leads ${whereSQL} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
    );
    const rows = dataStmt.all(...params, limit, offset) as Record<string, unknown>[];
    const data = rows.map(rowToLead);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  findById(id: number): Lead | null {
    const stmt = db.prepare('SELECT * FROM leads WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    return row ? rowToLead(row) : null;
  },

  create(input: LeadCreateInput): Lead {
    const stmt = db.prepare(`
      INSERT INTO leads (source, business_type, location, business_name, page_url, email, phone, address, rating, review_count, social_handle, description, raw_data, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      input.source,
      input.business_type,
      input.location,
      input.business_name ?? null,
      input.page_url ?? null,
      input.email ?? null,
      input.phone ?? null,
      input.address ?? null,
      input.rating ?? null,
      input.review_count ?? null,
      input.social_handle ?? null,
      input.description ?? null,
      input.raw_data ?? null,
      input.status ?? 'new',
    );

    return this.findById(result.lastInsertRowid as number)!;
  },

  update(id: number, input: LeadUpdateInput): Lead | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: unknown[] = [];

    if (input.business_name !== undefined) {
      fields.push('business_name = ?');
      params.push(input.business_name ?? null);
    }
    if (input.page_url !== undefined) {
      fields.push('page_url = ?');
      params.push(input.page_url ?? null);
    }
    if (input.email !== undefined) {
      fields.push('email = ?');
      params.push(input.email ?? null);
    }
    if (input.phone !== undefined) {
      fields.push('phone = ?');
      params.push(input.phone ?? null);
    }
    if (input.address !== undefined) {
      fields.push('address = ?');
      params.push(input.address ?? null);
    }
    if (input.rating !== undefined) {
      fields.push('rating = ?');
      params.push(input.rating ?? null);
    }
    if (input.review_count !== undefined) {
      fields.push('review_count = ?');
      params.push(input.review_count ?? null);
    }
    if (input.social_handle !== undefined) {
      fields.push('social_handle = ?');
      params.push(input.social_handle ?? null);
    }
    if (input.description !== undefined) {
      fields.push('description = ?');
      params.push(input.description ?? null);
    }
    if (input.status !== undefined) {
      fields.push('status = ?');
      params.push(input.status);
    }

    if (fields.length === 0) return existing;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const stmt = db.prepare(
      `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`,
    );
    stmt.run(...params);

    return this.findById(id);
  },

  delete(id: number): boolean {
    const stmt = db.prepare('DELETE FROM leads WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  bulkUpdateStatus(ids: number[], status: string): number {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(
      `UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
    );
    const result = stmt.run(status, ...ids);
    return result.changes;
  },

  bulkDeleteByIds(ids: number[]): number {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM leads WHERE id IN (${placeholders})`);
    const result = stmt.run(...ids);
    return result.changes;
  },

  bulkDeleteByFilter(filter: LeadFilters): number {
    const { whereClauses, params } = buildWhereClause(filter);
    if (whereClauses.length === 0) return 0;

    const whereSQL = 'WHERE ' + whereClauses.join(' AND ');
    const stmt = db.prepare(`DELETE FROM leads ${whereSQL}`);
    const result = stmt.run(...params);
    return result.changes;
  },

  findByUrlAndSource(url: string, source: string): Lead | null {
    const stmt = db.prepare('SELECT * FROM leads WHERE page_url = ? AND source = ?');
    const row = stmt.get(url, source) as Record<string, unknown> | undefined;
    return row ? rowToLead(row) : null;
  },

  getStats(): {
    totalLeads: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
    withEmail: number;
    withPhone: number;
    withBoth: number;
  } {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number };
    const totalLeads = totalRow.count;

    const sourceRows = db.prepare(
      'SELECT source, COUNT(*) as count FROM leads GROUP BY source',
    ).all() as { source: string; count: number }[];

    const statusRows = db.prepare(
      'SELECT status, COUNT(*) as count FROM leads GROUP BY status',
    ).all() as { status: string; count: number }[];

    const emailRow = db.prepare(
      "SELECT COUNT(*) as count FROM leads WHERE email IS NOT NULL AND email != ''",
    ).get() as { count: number };

    const phoneRow = db.prepare(
      "SELECT COUNT(*) as count FROM leads WHERE phone IS NOT NULL AND phone != ''",
    ).get() as { count: number };

    const bothRow = db.prepare(
      "SELECT COUNT(*) as count FROM leads WHERE email IS NOT NULL AND email != '' AND phone IS NOT NULL AND phone != ''",
    ).get() as { count: number };

    const bySource: Record<string, number> = {};
    for (const row of sourceRows) {
      bySource[row.source] = row.count;
    }

    const byStatus: Record<string, number> = {};
    for (const row of statusRows) {
      byStatus[row.status] = row.count;
    }

    // Ensure all sources and statuses are present even if zero
    for (const s of ['facebook', 'instagram', 'google_web', 'google_maps']) {
      if (!(s in bySource)) bySource[s] = 0;
    }
    for (const s of ['new', 'contacted', 'qualified', 'rejected']) {
      if (!(s in byStatus)) byStatus[s] = 0;
    }

    return {
      totalLeads,
      bySource,
      byStatus,
      withEmail: emailRow.count,
      withPhone: phoneRow.count,
      withBoth: bothRow.count,
    };
  },

  getRecentStats(): { last24h: number; last7d: number } {
    const last24hRow = db.prepare(
      "SELECT COUNT(*) as count FROM leads WHERE created_at >= datetime('now', '-1 day')",
    ).get() as { count: number };

    const last7dRow = db.prepare(
      "SELECT COUNT(*) as count FROM leads WHERE created_at >= datetime('now', '-7 days')",
    ).get() as { count: number };

    return {
      last24h: last24hRow.count,
      last7d: last7dRow.count,
    };
  },
};
