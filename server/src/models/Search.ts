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
  async create(input: SearchCreateInput): Promise<SearchRecord> {
    await db.execute(
      `INSERT INTO searches (source, query_params, run_status)
       VALUES (?, ?, ?)`,
      [input.source, input.query_params, input.run_status ?? 'running'],
    );

    const idResult = await db.execute('SELECT last_insert_rowid() as id');
    const newId = (idResult.rows[0] as any).id;
    return this.findById(newId) as Promise<SearchRecord>;
  },

  async findById(id: number): Promise<SearchRecord | null> {
    const result = await db.execute('SELECT * FROM searches WHERE id = ?', [id]);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return row ? rowToSearch(row) : null;
  },

  async findAll(
    pagination: { page: number; limit: number },
  ): Promise<{ data: SearchRecord[]; meta: PaginationMeta }> {
    const page = Math.max(1, pagination.page);
    const limit = Math.min(100, Math.max(1, pagination.limit));
    const offset = (page - 1) * limit;

    const countResult = await db.execute('SELECT COUNT(*) as total FROM searches');
    const total = (countResult.rows[0] as any).total;

    const dataResult = await db.execute(
      'SELECT * FROM searches ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset],
    );
    const data = dataResult.rows.map(rowToSearch);

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

  async updateStatus(id: number, status: 'running' | 'completed' | 'failed', resultsCount?: number): Promise<SearchRecord | null> {
    if (resultsCount !== undefined) {
      await db.execute(
        'UPDATE searches SET run_status = ?, results_count = ? WHERE id = ?',
        [status, resultsCount, id],
      );
    } else {
      await db.execute(
        'UPDATE searches SET run_status = ? WHERE id = ?',
        [status, id],
      );
    }

    return this.findById(id);
  },

  async getRecentStats(): Promise<{ last24h: number; last7d: number }> {
    const last24hResult = await db.execute(
      "SELECT COUNT(*) as count FROM searches WHERE created_at >= datetime('now', '-1 day')",
    );
    const last7dResult = await db.execute(
      "SELECT COUNT(*) as count FROM searches WHERE created_at >= datetime('now', '-7 days')",
    );

    return {
      last24h: (last24hResult.rows[0] as any).count,
      last7d: (last7dResult.rows[0] as any).count,
    };
  },

  async findRecent(limit: number = 5): Promise<SearchRecord[]> {
    const result = await db.execute(
      'SELECT * FROM searches ORDER BY created_at DESC LIMIT ?',
      [limit],
    );
    return result.rows.map(rowToSearch);
  },
};
