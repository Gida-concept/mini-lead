import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Thin compatibility wrapper — makes sql.js look like better-sqlite3
// ---------------------------------------------------------------------------

interface RunResult {
  changes: number;
  lastInsertRowid: number;
}

class StatementWrapper {
  constructor(
    private sql: string,
    private db: SqlJsDatabase,
    private dbWrapper: DatabaseWrapper,
  ) {}

  /** Return first matching row or undefined */
  get(...params: any[]): Record<string, unknown> | undefined {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params);
    const has = stmt.step();
    if (has) {
      const row = stmt.getAsObject() as Record<string, unknown>;
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  }

  /** Return all matching rows */
  all(...params: any[]): Record<string, unknown>[] {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params);
    const rows: Record<string, unknown>[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject() as Record<string, unknown>);
    }
    stmt.free();
    return rows;
  }

  /** Run INSERT/UPDATE/DELETE -- returns { changes, lastInsertRowid } */
  run(...params: any[]): RunResult {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();

    const changes = this.db.getRowsModified();
    const lastIdResult = this.db.exec('SELECT last_insert_rowid()');
    const lastInsertRowid =
      lastIdResult.length > 0
        ? (lastIdResult[0].values[0][0] as number)
        : 0;

    this.dbWrapper.markDirty();

    return { changes, lastInsertRowid };
  }
}

class DatabaseWrapper {
  private db: SqlJsDatabase;
  private filePath: string;
  private dirty = false;

  constructor(sql: SqlJsStatic, filePath: string, loadExisting: boolean) {
    this.filePath = filePath;

    if (loadExisting && fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      this.db = new sql.Database(buffer);
    } else {
      this.db = new sql.Database();
    }
  }

  /** Return a prepared-statement wrapper */
  prepare(sql: string): StatementWrapper {
    return new StatementWrapper(sql, this.db, this);
  }

  /** Execute one or more SQL statements (DDL mostly), no results returned */
  exec(sql: string): void {
    this.db.exec(sql);
    this.markDirty();
  }

  /** Run pragma */
  pragma(value: string): void {
    this.db.run(`PRAGMA ${value}`);
  }

  /** Persist to disk if dirty */
  save(): void {
    if (!this.dirty) return;
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = this.db.export();
    fs.writeFileSync(this.filePath, Buffer.from(data));
    this.dirty = false;
  }

  markDirty(): void {
    this.dirty = true;
  }
}

// ---------------------------------------------------------------------------
// Initialize database
// ---------------------------------------------------------------------------

const dbPath = path.resolve(__dirname, '../..', env.DATABASE_PATH);

const SQL = await initSqlJs();
const db = new DatabaseWrapper(SQL, dbPath, true);

// Enable WAL-like mode (sql.js uses a single connection, but pragma is safe)
try {
  db.pragma('journal_mode = WAL');
} catch {
  // sql.js may not support WAL pragma, ignore
}
try {
  db.pragma('foreign_keys = ON');
} catch {
  // ignore
}

// Run migrations
function runMigrations(): void {
  const migrationsDir = path.resolve(__dirname, '../../database/migrations');

  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  if (!fs.existsSync(migrationsDir)) return;

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const rows = db.prepare('SELECT name FROM _migrations').all();
  const applied = new Set(rows.map((r: any) => r.name));

  for (const file of migrationFiles) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`Running migration: ${file}`);

    try {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
      console.log(`Migration ${file} applied`);
    } catch (err) {
      console.error(`Migration ${file} failed:`, err);
      throw err;
    }
  }

  // Save after all migrations
  db.save();
}

runMigrations();

export { db };
