import { describe, expect, it } from 'bun:test';
import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../infrastructure/db/schema/index.js';
import { UserRepository } from '../../infrastructure/db/repositories/user.repository.js';
import { EconomyService } from './economy.service.js';

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

describe('EconomyService', () => {
  it('da recompensa diaria y respeta cooldown', () => {
    const db = createTestDb();
    const users = new UserRepository(db);
    let now = new Date('2026-01-01T12:00:00.000Z');
    const economy = new EconomyService(users, () => 0.5, () => now);

    const first = economy.claimDaily('111');
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.value.amount).toBe(55);
      expect(first.value.balance).toBe(55);
    }

    const second = economy.claimDaily('111');
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.code).toBe('COOLDOWN');
    }

    now = new Date('2026-01-02T12:00:01.000Z');
    const third = economy.claimDaily('111');
    expect(third.ok).toBe(true);
  });

  it('transfiere monedas y rechaza fondos insuficientes', () => {
    const db = createTestDb();
    const users = new UserRepository(db);
    users.getOrCreate('111');
    users.updateBalance('111', 100);
    const economy = new EconomyService(users);

    const transfer = economy.transfer('111', '222', 20);
    expect(transfer.ok).toBe(true);
    if (transfer.ok) {
      expect(transfer.value.fromBalance).toBe(80);
      expect(transfer.value.toBalance).toBe(20);
    }

    const fail = economy.transfer('111', '222', 999);
    expect(fail.ok).toBe(false);
    if (!fail.ok) {
      expect(fail.error.code).toBe('INSUFFICIENT_FUNDS');
    }
  });

  it('rechaza auto-transferencia y montos inválidos', () => {
    const db = createTestDb();
    const economy = new EconomyService(new UserRepository(db));

    expect(economy.transfer('111', '111', 10).ok).toBe(false);
    expect(economy.transfer('111', '222', 0).ok).toBe(false);
    expect(economy.transfer('111', '222', 1.5).ok).toBe(false);
  });
});
