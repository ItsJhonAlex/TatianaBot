import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SapphireClient, LogLevel } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';
import type { Env } from '../config/env.js';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export function createClient(env: Env): SapphireClient {
  return new SapphireClient({
    baseUserDirectory: srcRoot,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
    loadMessageCommandListeners: false,
    logger: {
      level: env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Info,
    },
  });
}
