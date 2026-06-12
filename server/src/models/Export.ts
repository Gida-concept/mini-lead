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
  create(input: ExportCreateInput): ExportRecord {
    const stmt = db.prepare(`
      INSERT INTO exports (filename, filter_source, record_count)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(input.filename, input.filter_source, input.record_count);
    const row = db.prepare('SELECT * FROM exports WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
    return rowToExport(row);
  },

  findAll(): ExportRecord[] {
    const rows = db.prepare(
      'SELECT * FROM exports ORDER BY created_at DESC',
    ).all() as Record<string, unknown>[];

    return rows.map(rowToExport);
  },

  getRecentStats(): { last24h: number; last7d: number } {
    const last24hRow = db.prepare(
      "SELECT COUNT(*) as count FROM exports WHERE created_at >= datetime('now', '-1 day')",
    ).get() as { count: number };

    const last7dRow = db.prepare(
      "SELECT COUNT(*) as count FROM exports WHERE created_at >= datetime('now', '-7 days')",
    ).get() as { count: number };

    return {
      last24h: last24hRow.count,
      last7d: last7dRow.count,
    };
  },
};
