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
  async findAll(
    filters: LeadFilters,
    pagination: { page: number; limit: number },
    sort: { sortBy: string; sortOrder: string },
  ): Promise<{ data: Lead[]; meta: PaginationMeta }> {
    const { whereClauses, params } = buildWhereClause(filters);
    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const sortBy = sanitizeSortBy(sort.sortBy);
    const sortOrder = sanitizeSortOrder(sort.sortOrder);

    const page = Math.max(1, pagination.page);
    const limit = Math.min(100, Math.max(1, pagination.limit));
    const offset = (page - 1) * limit;

    // Count query
    const countResult = await db.execute(`SELECT COUNT(*) as total FROM leads ${whereSQL}`, params);
    const total = (countResult.rows[0] as any).total;

    // Data query
    const dataResult = await db.execute(
      `SELECT * FROM leads ${whereSQL} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const data = dataResult.rows.map(rowToLead);

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

  async findById(id: number): Promise<Lead | null> {
    const result = await db.execute('SELECT * FROM leads WHERE id = ?', [id]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToLead(row) : null;
  },

  async create(input: LeadCreateInput): Promise<Lead> {
    await db.execute(
      `INSERT INTO leads (source, business_type, location, business_name, page_url, email, phone, address, rating, review_count, social_handle, description, raw_data, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ],
    );

    const idResult = await db.execute('SELECT last_insert_rowid() as id');
    const newId = (idResult.rows[0] as any).id;
    return this.findById(newId) as Promise<Lead>;
  },

  async update(id: number, input: LeadUpdateInput): Promise<Lead | null> {
    const existing = await this.findById(id);
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

    await db.execute(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, params);

    return this.findById(id);
  },

  async delete(id: number): Promise<boolean> {
    const result = await db.execute('DELETE FROM leads WHERE id = ?', [id]);
    return result.rowCount > 0;
  },

  async bulkUpdateStatus(ids: number[], status: string): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const result = await db.execute(
      `UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      [status, ...ids],
    );
    return result.rowCount;
  },

  async bulkDeleteByIds(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const result = await db.execute(`DELETE FROM leads WHERE id IN (${placeholders})`, ids);
    return result.rowCount;
  },

  async bulkDeleteByFilter(filter: LeadFilters): Promise<number> {
    const { whereClauses, params } = buildWhereClause(filter);
    if (whereClauses.length === 0) return 0;

    const whereSQL = 'WHERE ' + whereClauses.join(' AND ');
    const result = await db.execute(`DELETE FROM leads ${whereSQL}`, params);
    return result.rowCount;
  },

  async findByUrlAndSource(url: string, source: string): Promise<Lead | null> {
    const result = await db.execute('SELECT * FROM leads WHERE page_url = ? AND source = ?', [url, source]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToLead(row) : null;
  },

  async getStats(): Promise<{
    totalLeads: number;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
    withEmail: number;
    withPhone: number;
    withBoth: number;
  }> {
    const totalResult = await db.execute('SELECT COUNT(*) as count FROM leads');
    const totalLeads = (totalResult.rows[0] as any).count;

    const sourceResult = await db.execute('SELECT source, COUNT(*) as count FROM leads GROUP BY source');
    const statusResult = await db.execute('SELECT status, COUNT(*) as count FROM leads GROUP BY status');
    const emailResult = await db.execute("SELECT COUNT(*) as count FROM leads WHERE email IS NOT NULL AND email != ''");
    const phoneResult = await db.execute("SELECT COUNT(*) as count FROM leads WHERE phone IS NOT NULL AND phone != ''");
    const bothResult = await db.execute("SELECT COUNT(*) as count FROM leads WHERE email IS NOT NULL AND email != '' AND phone IS NOT NULL AND phone != ''");

    const bySource: Record<string, number> = {};
    for (const row of sourceResult.rows as any[]) {
      bySource[row.source] = row.count;
    }

    const byStatus: Record<string, number> = {};
    for (const row of statusResult.rows as any[]) {
      byStatus[row.status] = row.count;
    }

    // Ensure all sources and statuses are present even if zero
    for (const s of ['google_maps']) {
      if (!(s in bySource)) bySource[s] = 0;
    }
    for (const s of ['new', 'contacted', 'qualified', 'rejected']) {
      if (!(s in byStatus)) byStatus[s] = 0;
    }

    return {
      totalLeads,
      bySource,
      byStatus,
      withEmail: (emailResult.rows[0] as any).count,
      withPhone: (phoneResult.rows[0] as any).count,
      withBoth: (bothResult.rows[0] as any).count,
    };
  },

  async getRecentStats(): Promise<{ last24h: number; last7d: number }> {
    const last24hResult = await db.execute(
      "SELECT COUNT(*) as count FROM leads WHERE created_at >= datetime('now', '-1 day')",
    );
    const last7dResult = await db.execute(
      "SELECT COUNT(*) as count FROM leads WHERE created_at >= datetime('now', '-7 days')",
    );

    return {
      last24h: (last24hResult.rows[0] as any).count,
      last7d: (last7dResult.rows[0] as any).count,
    };
  },
};
