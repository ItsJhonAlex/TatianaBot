import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv, resolveDatabasePath } from '../../config/env.js';
import { createDatabase } from './client.js';
import { createLogger } from '../../lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function main() {
  const env = parseEnv();
  const logger = createLogger(env);

  const db = createDatabase(env.DATABASE_URL);
  const migrationsFolder = join(__dirname, 'migrations');

  mkdirSync(dirname(resolveDatabasePath(env.DATABASE_URL)), { recursive: true });

  migrate(db, { migrationsFolder });
  logger.info('Migraciones aplicadas correctamente');
}

try {
  main();
} catch (error: unknown) {
  console.error('Error al ejecutar migraciones:', error);
  process.exit(1);
}
