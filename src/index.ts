import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { ApplicationCommandRegistries } from '@sapphire/framework';
import { parseEnv } from './config/env.js';
import { createClient } from './lib/client.js';
import { createLogger } from './lib/logger.js';
import { registerContainerServices } from './lib/container.js';
import { RateLimiter } from './lib/rate-limiter.js';
import { createDatabase } from './infrastructure/db/client.js';
import { UserRepository } from './infrastructure/db/repositories/user.repository.js';
import { ConversationRepository } from './infrastructure/db/repositories/conversation.repository.js';
import { StatusMessageRepository } from './infrastructure/db/repositories/status-message.repository.js';
import { HttpClient } from './infrastructure/http/http-client.js';
import { CatchAttemptRepository } from './infrastructure/db/repositories/catch-attempt.repository.js';
import { PokemonRepository } from './infrastructure/db/repositories/pokemon.repository.js';
import { YugiohRepository } from './infrastructure/db/repositories/yugioh.repository.js';
import {
  AutomodRuleRepository,
  GuildSettingsRepository,
  ModActionRepository,
} from './infrastructure/db/repositories/moderation.repository.js';
import { EmbedRepository } from './infrastructure/db/repositories/embed.repository.js';
import { CharacterRepository } from './infrastructure/db/repositories/character.repository.js';
import { EconomyService } from './domain/economy/economy.service.js';
import { MemoryService } from './domain/chat/memory.service.js';
import { ChatService } from './domain/chat/chat.service.js';
import { loadSystemPrompt } from './domain/chat/persona.js';
import { EightBallService } from './domain/social/eightball.service.js';
import { MemeService } from './domain/social/meme.service.js';
import { AnimeService } from './domain/social/anime.service.js';
import { CatchGameService } from './domain/catch-games/catch-game.service.js';
import { PokemonService } from './domain/catch-games/pokemon.service.js';
import { YugiohService } from './domain/catch-games/yugioh.service.js';
import { CatchSpawnRegistry } from './domain/catch-games/catch-spawn.registry.js';
import { AutomodService } from './domain/moderation/automod.service.js';
import { EmbedService } from './domain/embeds/embed.service.js';
import { CharacterService } from './domain/rpg/character.service.js';
import { LoreService } from './domain/rpg/lore.service.js';
import { AdventureSessionRegistry } from './domain/rpg/adventure-session.registry.js';
import { createShoukaku, MusicService } from './domain/music/music.service.js';
import { MusicDownloadService } from './domain/music/music-download.service.js';
import { GroqProvider } from './infrastructure/llm/groq-provider.js';
import { StatusService } from './core/status.service.js';
import { MetricsService } from './core/metrics.service.js';
import { ChangelogService } from './domain/changelog/changelog.service.js';

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

  const userRepository = new UserRepository(db);
  const conversationRepository = new ConversationRepository(db);
  const statusMessageRepository = new StatusMessageRepository(db);
  const catchAttemptRepository = new CatchAttemptRepository(db);
  const pokemonRepository = new PokemonRepository(db);
  const yugiohRepository = new YugiohRepository(db);
  const guildSettingsRepository = new GuildSettingsRepository(db);
  const automodRuleRepository = new AutomodRuleRepository(db);
  const modActionRepository = new ModActionRepository(db);
  const embedRepository = new EmbedRepository(db);
  const characterRepository = new CharacterRepository(db);
  const httpClient = new HttpClient();
  const rateLimiter = new RateLimiter();

  const economyService = new EconomyService(userRepository);
  const memoryService = new MemoryService(conversationRepository);
  const chatService = new ChatService(
    new GroqProvider(env.GROQ_API_KEY, env.GROQ_MODEL),
    memoryService,
    loadSystemPrompt(),
  );
  const metricsService = new MetricsService();
  const changelogService = new ChangelogService();
  const statusService = new StatusService(statusMessageRepository, appLogger, metricsService);
  const eightBallService = new EightBallService();
  const memeService = new MemeService(httpClient);
  const animeService = new AnimeService(httpClient);
  const catchGameService = new CatchGameService(catchAttemptRepository);
  const pokemonService = new PokemonService(httpClient, pokemonRepository, userRepository);
  const yugiohService = new YugiohService(httpClient, yugiohRepository, userRepository);
  const catchSpawnRegistry = new CatchSpawnRegistry();
  const automodService = new AutomodService(
    guildSettingsRepository,
    automodRuleRepository,
    modActionRepository,
  );
  const embedService = new EmbedService(embedRepository);
  const characterService = new CharacterService(characterRepository);
  const loreService = new LoreService();
  const adventureSessionRegistry = new AdventureSessionRegistry();

  const client = createClient(env);

  let musicService: MusicService | null = null;
  if (env.LAVALINK_HOST && env.LAVALINK_PASSWORD) {
    const shoukaku = createShoukaku(client, {
      host: env.LAVALINK_HOST,
      port: env.LAVALINK_PORT,
      password: env.LAVALINK_PASSWORD,
      secure: env.LAVALINK_SECURE,
    });

    let downloadService: MusicDownloadService | null = null;
    if (env.MUSIC_USE_DOWNLOAD) {
      const candidate = new MusicDownloadService(
        {
          hostCacheDir: env.MUSIC_CACHE_DIR,
          lavalinkCacheDir: env.LAVALINK_CACHE_DIR,
          ytdlpPath: env.YTDLP_PATH,
          cookiesFromBrowser: env.YTDLP_COOKIES_FROM_BROWSER,
        },
        appLogger,
      );
      if (await candidate.ensureReady()) {
        downloadService = candidate;
        appLogger.info(
          { cacheDir: env.MUSIC_CACHE_DIR },
          'Música en modo descarga (yt-dlp → local → borrar)',
        );
      } else {
        appLogger.warn(
          'yt-dlp no disponible — música en modo stream Lavalink. Instala yt-dlp para modo descarga.',
        );
      }
    }

    musicService = new MusicService(shoukaku, appLogger, downloadService);
    appLogger.info(
      { host: env.LAVALINK_HOST, port: env.LAVALINK_PORT },
      'Música habilitada (Lavalink/Shoukaku)',
    );
  } else {
    appLogger.info('Música deshabilitada (define LAVALINK_HOST y LAVALINK_PASSWORD para activarla)');
  }

  registerContainerServices({
    db,
    env,
    appLogger,
    economyService,
    chatService,
    statusService,
    metricsService,
    changelogService,
    eightBallService,
    memeService,
    animeService,
    catchGameService,
    pokemonService,
    yugiohService,
    catchSpawnRegistry,
    automodService,
    embedService,
    characterService,
    loreService,
    adventureSessionRegistry,
    musicService,
    rateLimiter,
  });

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
