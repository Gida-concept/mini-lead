import { db } from '../config/database.js';
import type { SearchRecord, SearchCreateInput, PaginationMeta } from '../types/index.js';

function rowToSearch(row: Record<string, unknown>): SearchRecord {
  return {
    id: row.id as number,
    source: row.source as string,
    query_params: row.query_params as string,
    results_count: (row.results_count as number) ?? null,
    run_status: row.run_status as SearchRecord['run_status'],
    apify_run_id: (row.apify_run_id as string) ?? null,
    created_at: row.created_at as string,
  };
}

export const SearchModel = {
  create(input: SearchCreateInput): SearchRecord {
    const stmt = db.prepare(`
      INSERT INTO searches (source, query_params, run_status)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      input.source,
      input.query_params,
      input.run_status ?? 'running',
    );

    return this.findById(result.lastInsertRowid as number)!;
  },

  findById(id: number): SearchRecord | null {
    const stmt = db.prepare('SELECT * FROM searches WHERE id = ?');
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    return row ? rowToSearch(row) : null;
  },

  findAll(
    pagination: { page: number; limit: number },
  ): { data: SearchRecord[]; meta: PaginationMeta } {
    const page = Math.max(1, pagination.page);
    const limit = Math.min(100, Math.max(1, pagination.limit));
    const offset = (page - 1) * limit;

    const countRow = db.prepare('SELECT COUNT(*) as total FROM searches').get() as { total: number };
    const total = countRow.total;

    const rows = db.prepare(
      'SELECT * FROM searches ORDER BY created_at DESC LIMIT ? OFFSET ?',
    ).all(limit, offset) as Record<string, unknown>[];

    const data = rows.map(rowToSearch);

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

  updateStatus(id: number, status: 'running' | 'completed' | 'failed', resultsCount?: number): SearchRecord | null {
    if (resultsCount !== undefined) {
      const stmt = db.prepare(
        'UPDATE searches SET run_status = ?, results_count = ? WHERE id = ?',
      );
      stmt.run(status, resultsCount, id);
    } else {
      const stmt = db.prepare(
        'UPDATE searches SET run_status = ? WHERE id = ?',
      );
      stmt.run(status, id);
    }

    return this.findById(id);
  },

  getRecentStats(): { last24h: number; last7d: number } {
    const last24hRow = db.prepare(
      "SELECT COUNT(*) as count FROM searches WHERE created_at >= datetime('now', '-1 day')",
    ).get() as { count: number };

    const last7dRow = db.prepare(
      "SELECT COUNT(*) as count FROM searches WHERE created_at >= datetime('now', '-7 days')",
    ).get() as { count: number };

    return {
      last24h: last24hRow.count,
      last7d: last7dRow.count,
    };
  },

  findRecent(limit: number = 5): SearchRecord[] {
    const rows = db.prepare(
      'SELECT * FROM searches ORDER BY created_at DESC LIMIT ?',
    ).all(limit) as Record<string, unknown>[];

    return rows.map(rowToSearch);
  },
};
