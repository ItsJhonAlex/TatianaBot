import { container } from '@sapphire/framework';
import type { Env } from '../config/env.js';
import type { ChatService } from '../domain/chat/chat.service.js';
import type { EconomyService } from '../domain/economy/economy.service.js';
import type { EightBallService } from '../domain/social/eightball.service.js';
import type { MemeService } from '../domain/social/meme.service.js';
import type { AnimeService } from '../domain/social/anime.service.js';
import type { StatusService } from '../core/status.service.js';
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
    eightBallService: EightBallService;
    memeService: MemeService;
    animeService: AnimeService;
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
  eightBallService: EightBallService;
  memeService: MemeService;
  animeService: AnimeService;
  rateLimiter: RateLimiter;
}

export function registerContainerServices(services: AppContainerServices): void {
  container.db = services.db;
  container.env = services.env;
  container.appLogger = services.appLogger;
  container.economyService = services.economyService;
  container.chatService = services.chatService;
  container.statusService = services.statusService;
  container.eightBallService = services.eightBallService;
  container.memeService = services.memeService;
  container.animeService = services.animeService;
  container.rateLimiter = services.rateLimiter;
}
