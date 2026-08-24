import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { resolveDatabasePath } from '../../config/env.js';
import * as schema from './schema/index.js';

export function createDatabase(databaseUrl: string) {
  const path = resolveDatabasePath(databaseUrl);
  mkdirSync(dirname(path), { recursive: true });

  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  return drizzle(sqlite, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
