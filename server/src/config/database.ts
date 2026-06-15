import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Async database interface
// ---------------------------------------------------------------------------

export interface DbResult {
  rows: any[];
  rowCount: number;
}

export interface DbAsync {
  execute(sql: string, params?: any[]): Promise<DbResult>;
}

let db: DbAsync;

// ---------------------------------------------------------------------------
// sql.js provider
// ---------------------------------------------------------------------------

async function createSqlJsDb(): Promise<DbAsync> {
  const { default: initSqlJs } = await import('sql.js');
  const SQL = await initSqlJs();

  const dbPath = path.resolve(__dirname, '../..', env.DATABASE_PATH);
  let sqlJsDb: any;
  let dirty = false;

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqlJsDb = new SQL.Database(buffer);
  } else {
    sqlJsDb = new SQL.Database();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  function markDirty(): void {
    dirty = true;
  }

  function save(): void {
    if (!dirty) return;
    const data = sqlJsDb.export();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, Buffer.from(data));
    dirty = false;
  }

  // Run pragmas — use sql.js run() directly for PRAGMA statements
  try {
    sqlJsDb.run('PRAGMA journal_mode = WAL');
  } catch {
    // sql.js may not support WAL pragma, ignore
  }
  try {
    sqlJsDb.run('PRAGMA foreign_keys = ON');
  } catch {
    // ignore
  }

  const dbAsync: DbAsync = {
    async execute(sql: string, params?: any[]): Promise<DbResult> {
      const p = params || [];
      const isWrite = /^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i.test(sql.trim());

      // Handle PRAGMA directly
      if (/^\s*PRAGMA\b/i.test(sql)) {
        sqlJsDb.run(sql);
        return { rows: [], rowCount: 0 };
      }

      const stmt = sqlJsDb.prepare(sql);
      stmt.bind(p);

      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      let rowCount = rows.length;

      if (isWrite) {
        rowCount = sqlJsDb.getRowsModified();
        markDirty();
      }

      return { rows, rowCount };
    },
  };

  // Run migrations
  await runMigrations(dbAsync);

  // Save after all migrations
  save();

  return dbAsync;
}

// ---------------------------------------------------------------------------
// Turso (@libsql/client) provider
// ---------------------------------------------------------------------------

async function createTursoDb(): Promise<DbAsync> {
  const { createClient } = await import('@libsql/client');

  if (!env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is required when DATABASE_PROVIDER=turso');
  }

  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  const dbAsync: DbAsync = {
    async execute(sql: string, params?: any[]): Promise<DbResult> {
      const result = await client.execute({
        sql,
        args: params || [],
      });
      return {
        rows: result.rows as any[],
        // For SELECT, this is the number of rows returned.
        // For INSERT/UPDATE/DELETE, @libsql/client returns rows affected.
        rowCount: result.rows.length,
      };
    },
  };

  // Run migrations
  await runMigrations(dbAsync);

  return dbAsync;
}

// ---------------------------------------------------------------------------
// Migration runner (async)
// ---------------------------------------------------------------------------

async function runMigrations(database: DbAsync): Promise<void> {
  const migrationsDir = path.resolve(__dirname, '../../database/migrations');

  // Create migration tracking table
  await database.execute(`
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

  if (migrationFiles.length === 0) return;

  const result = await database.execute('SELECT name FROM _migrations');
  const applied = new Set(result.rows.map((r: any) => r.name));

  for (const file of migrationFiles) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`Running migration: ${file}`);

    try {
      // Split multi-statement migration files by semicolons
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        await database.execute(stmt);
      }

      await database.execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
      console.log(`Migration ${file} applied`);
    } catch (err) {
      console.error(`Migration ${file} failed:`, err);
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

if (env.DATABASE_PROVIDER === 'turso') {
  console.log('[database] Using Turso provider');
  db = await createTursoDb();
} else {
  console.log('[database] Using sql.js provider');
  db = await createSqlJsDb();
}

export { db };
