import { db } from '../config/database.js';
import type { ExportRecord, ExportCreateInput } from '../types/index.js';

function rowToExport(row: Record<string, unknown>): ExportRecord {
  return {
    id: row.id as number,
    filename: (row.filename as string) ?? null,
    filter_source: (row.filter_source as string) ?? null,
    record_count: (row.record_count as number) ?? null,
    created_at: row.created_at as string,
  };
}

export const ExportModel = {
  async create(input: ExportCreateInput): Promise<ExportRecord> {
    await db.execute(
      `INSERT INTO exports (filename, filter_source, record_count)
       VALUES (?, ?, ?)`,
      [input.filename, input.filter_source, input.record_count],
    );

    const idResult = await db.execute('SELECT last_insert_rowid() as id');
    const newId = (idResult.rows[0] as any).id;
    const rowResult = await db.execute('SELECT * FROM exports WHERE id = ?', [newId]);
    return rowToExport(rowResult.rows[0] as Record<string, unknown>);
  },

  async findAll(): Promise<ExportRecord[]> {
    const result = await db.execute('SELECT * FROM exports ORDER BY created_at DESC');
    return result.rows.map(rowToExport);
  },

  async getRecentStats(): Promise<{ last24h: number; last7d: number }> {
    const last24hResult = await db.execute(
      "SELECT COUNT(*) as count FROM exports WHERE created_at >= datetime('now', '-1 day')",
    );
    const last7dResult = await db.execute(
      "SELECT COUNT(*) as count FROM exports WHERE created_at >= datetime('now', '-7 days')",
    );

    return {
      last24h: (last24hResult.rows[0] as any).count,
      last7d: (last7dResult.rows[0] as any).count,
    };
  },
};
