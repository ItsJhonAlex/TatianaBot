import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { ApplicationCommandRegistries } from '@sapphire/framework';
import { parseEnv } from './config/env.js';
import { createClient } from './lib/client.js';
import { createLogger } from './lib/logger.js';
import { registerContainerServices } from './lib/container.js';
import { createDatabase } from './infrastructure/db/client.js';

const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  'infrastructure/db/migrations',
);

async function main() {
  const env = parseEnv();
  const appLogger = createLogger(env);
  const db = createDatabase(env.DATABASE_URL);

  migrate(db, { migrationsFolder });
  appLogger.info('Base de datos lista');

  if (env.DEV_GUILD_ID) {
    ApplicationCommandRegistries.setDefaultGuildIds([env.DEV_GUILD_ID]);
    appLogger.info({ guildId: env.DEV_GUILD_ID }, 'Slash commands en modo guild de desarrollo');
  }

  registerContainerServices({ db, appLogger });

  const client = createClient(env);

  client.once('error', (error: Error) => {
    appLogger.error({ err: error }, 'Error del cliente Discord');
  });

  process.on('unhandledRejection', (reason: unknown) => {
    appLogger.error({ err: reason }, 'Promesa rechazada sin manejar');
  });

  await client.login(env.DISCORD_TOKEN);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
