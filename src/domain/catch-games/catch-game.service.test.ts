import { describe, expect, it } from 'bun:test';
import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../infrastructure/db/schema/index.js';
import { CatchAttemptRepository } from '../../infrastructure/db/repositories/catch-attempt.repository.js';
import { CatchGameService, CATCH_MAX_ATTEMPTS } from './catch-game.service.js';

function createTestDb() {
  const sqlite = new BunDatabase(':memory:');
  const db = drizzle(sqlite, { schema });
  const migrationsFolder = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../infrastructure/db/migrations',
  );
  migrate(db, { migrationsFolder });
  return db;
}

describe('CatchGameService', () => {
  it('consume intentos y bloquea al agotarlos', () => {
    const attempts = new CatchAttemptRepository(createTestDb());
    let now = new Date('2026-01-01T12:00:00.000Z');
    const service = new CatchGameService(attempts, () => now);

    for (let i = 0; i < CATCH_MAX_ATTEMPTS; i++) {
      const result = service.consumeAttempt('111', 'pokemon');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.remaining).toBe(CATCH_MAX_ATTEMPTS - i - 1);
      }
    }

    const blocked = service.consumeAttempt('111', 'pokemon');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.code).toBe('NO_ATTEMPTS');
    }

    const yugioh = service.consumeAttempt('111', 'yugioh');
    expect(yugioh.ok).toBe(true);

    now = new Date('2026-01-01T13:00:01.000Z');
    const reset = service.consumeAttempt('111', 'pokemon');
    expect(reset.ok).toBe(true);
    if (reset.ok) {
      expect(reset.value.remaining).toBe(CATCH_MAX_ATTEMPTS - 1);
    }
  });
});
