import { describe, expect, it } from 'bun:test';
import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../infrastructure/db/schema/index.js';
import {
  AutomodRuleRepository,
  GuildSettingsRepository,
  ModActionRepository,
} from '../../infrastructure/db/repositories/moderation.repository.js';
import { AutomodService } from './automod.service.js';

function createTestDb() {
  const sqlite = new BunDatabase(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, {
    migrationsFolder: join(
      dirname(fileURLToPath(import.meta.url)),
      '../../infrastructure/db/migrations',
    ),
  });
  return db;
}

describe('AutomodService', () => {
  it('detecta palabras prohibidas solo si está activo', () => {
    const db = createTestDb();
    const service = new AutomodService(
      new GuildSettingsRepository(db),
      new AutomodRuleRepository(db),
      new ModActionRepository(db),
    );

    service.addBannedWords('g1', ['spamword'], 'warn');
    expect(service.evaluateMessage({ guildId: 'g1', userId: 'u1', content: 'hello spamword' })).toBeNull();

    service.setEnabled('g1', true);
    const hit = service.evaluateMessage({
      guildId: 'g1',
      userId: 'u1',
      content: 'hello spamword',
    });
    expect(hit?.ruleType).toBe('banned_words');
    expect(hit?.action).toBe('warn');
  });

  it('detecta spam por umbral', () => {
    let now = 1_000;
    const db = createTestDb();
    const service = new AutomodService(
      new GuildSettingsRepository(db),
      new AutomodRuleRepository(db),
      new ModActionRepository(db),
      () => now,
    );
    service.setEnabled('g1', true);
    service.setSpamConfig('g1', 3, 5);

    expect(service.evaluateMessage({ guildId: 'g1', userId: 'u1', content: 'a' })).toBeNull();
    expect(service.evaluateMessage({ guildId: 'g1', userId: 'u1', content: 'b' })).toBeNull();
    expect(service.evaluateMessage({ guildId: 'g1', userId: 'u1', content: 'c' })).toBeNull();
    const hit = service.evaluateMessage({ guildId: 'g1', userId: 'u1', content: 'd' });
    expect(hit?.ruleType).toBe('spam');
    now += 10_000;
    expect(service.evaluateMessage({ guildId: 'g1', userId: 'u1', content: 'e' })).toBeNull();
  });
});
