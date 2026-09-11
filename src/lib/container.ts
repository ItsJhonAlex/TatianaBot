import { container } from '@sapphire/framework';
import type { Env } from '../config/env.js';
import type { ChatService } from '../domain/chat/chat.service.js';
import type { EconomyService } from '../domain/economy/economy.service.js';
import type { EightBallService } from '../domain/social/eightball.service.js';
import type { MemeService } from '../domain/social/meme.service.js';
import type { AnimeService } from '../domain/social/anime.service.js';
import type { CatchGameService } from '../domain/catch-games/catch-game.service.js';
import type { PokemonService } from '../domain/catch-games/pokemon.service.js';
import type { YugiohService } from '../domain/catch-games/yugioh.service.js';
import type { CatchSpawnRegistry } from '../domain/catch-games/catch-spawn.registry.js';
import type { AutomodService } from '../domain/moderation/automod.service.js';
import type { EmbedService } from '../domain/embeds/embed.service.js';
import type { CharacterService } from '../domain/rpg/character.service.js';
import type { LoreService } from '../domain/rpg/lore.service.js';
import type { AdventureSessionRegistry } from '../domain/rpg/adventure-session.registry.js';
import type { MusicService } from '../domain/music/music.service.js';
import type { ChangelogService } from '../domain/changelog/changelog.service.js';
import type { StatusService } from '../core/status.service.js';
import type { MetricsService } from '../core/metrics.service.js';
import type { Database } from '../infrastructure/db/client.js';
import type { RateLimiter } from './rate-limiter.js';
import type { Logger } from './logger.js';

declare module '@sapphire/pieces' {
  interface Container {
    db: Database;
    env: Env;
    appLogger: Logger;
    economyService: EconomyService;
    chatService: ChatService;
    statusService: StatusService;
    metricsService: MetricsService;
    changelogService: ChangelogService;
    eightBallService: EightBallService;
    memeService: MemeService;
    animeService: AnimeService;
    catchGameService: CatchGameService;
    pokemonService: PokemonService;
    yugiohService: YugiohService;
    catchSpawnRegistry: CatchSpawnRegistry;
    automodService: AutomodService;
    embedService: EmbedService;
    characterService: CharacterService;
    loreService: LoreService;
    adventureSessionRegistry: AdventureSessionRegistry;
    musicService: MusicService | null;
    rateLimiter: RateLimiter;
  }
}

export interface AppContainerServices {
  db: Database;
  env: Env;
  appLogger: Logger;
  economyService: EconomyService;
  chatService: ChatService;
  statusService: StatusService;
  metricsService: MetricsService;
  changelogService: ChangelogService;
  eightBallService: EightBallService;
  memeService: MemeService;
  animeService: AnimeService;
  catchGameService: CatchGameService;
  pokemonService: PokemonService;
  yugiohService: YugiohService;
  catchSpawnRegistry: CatchSpawnRegistry;
  automodService: AutomodService;
  embedService: EmbedService;
  characterService: CharacterService;
  loreService: LoreService;
  adventureSessionRegistry: AdventureSessionRegistry;
  musicService: MusicService | null;
  rateLimiter: RateLimiter;
}

export function registerContainerServices(services: AppContainerServices): void {
  container.db = services.db;
  container.env = services.env;
  container.appLogger = services.appLogger;
  container.economyService = services.economyService;
  container.chatService = services.chatService;
  container.statusService = services.statusService;
  container.metricsService = services.metricsService;
  container.changelogService = services.changelogService;
  container.eightBallService = services.eightBallService;
  container.memeService = services.memeService;
  container.animeService = services.animeService;
  container.catchGameService = services.catchGameService;
  container.pokemonService = services.pokemonService;
  container.yugiohService = services.yugiohService;
  container.catchSpawnRegistry = services.catchSpawnRegistry;
  container.automodService = services.automodService;
  container.embedService = services.embedService;
  container.characterService = services.characterService;
  container.loreService = services.loreService;
  container.adventureSessionRegistry = services.adventureSessionRegistry;
  container.musicService = services.musicService;
  container.rateLimiter = services.rateLimiter;
}
