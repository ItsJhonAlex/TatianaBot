import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { resolveDatabasePath } from '../../config/env.js';
import * as schema from './schema/index.js';

export function createDatabase(databaseUrl: string) {
  const path = resolveDatabasePath(databaseUrl);
  mkdirSync(dirname(path), { recursive: true });

  const sqlite = new BunDatabase(path, { create: true });
  sqlite.run('PRAGMA journal_mode = WAL;');
  sqlite.run('PRAGMA foreign_keys = ON;');

  return drizzle(sqlite, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
