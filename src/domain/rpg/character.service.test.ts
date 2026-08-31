import { describe, expect, it } from 'bun:test';
import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../infrastructure/db/schema/index.js';
import { CharacterRepository } from '../../infrastructure/db/repositories/character.repository.js';
import { CharacterService } from './character.service.js';
import { calculateStats, getRace } from './stats.js';

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

describe('CharacterService + race bonuses', () => {
  it('aplica bonuses de raza a stats finales', () => {
    const elf = getRace('ELF');
    expect(elf?.bonuses.dexterity).toBe(2);

    const withRace = calculateStats({
      raceId: 'ELF',
      primaryClass: 'Archer',
      secondaryClass: 'Rogue',
      profession: 'Hunter',
      random: () => 0,
    });
    const withoutRace = calculateStats({
      raceId: 'UNKNOWN',
      primaryClass: 'Archer',
      secondaryClass: 'Rogue',
      profession: 'Hunter',
      random: () => 0,
    });

    expect(withRace.stats.dexterity).toBe(withoutRace.stats.dexterity + 2);
    expect(withRace.stats.wisdom).toBe(withoutRace.stats.wisdom + 1);
  });

  it('crea y elimina personaje', () => {
    const service = new CharacterService(new CharacterRepository(createTestDb()), () => 0);
    const created = service.create({
      discordId: '111',
      name: 'Lyra',
      surname: 'Dawn',
      raceId: 'ELF',
      gender: 'Female',
      primaryClass: 'Mage',
      secondaryClass: 'Priest',
      primordialClass: 'Versatile Adventurer',
      profession: 'Alchemist',
    });
    expect(created.ok).toBe(true);
    if (created.ok) {
      expect(created.value.raceBonuses.dexterity).toBe(2);
      expect(created.value.stats.dexterity).toBeGreaterThan(10);
    }

    expect(service.create({
      discordId: '111',
      name: 'A',
      surname: 'B',
      raceId: 'HUMAN',
      gender: 'Male',
      primaryClass: 'Warrior',
      secondaryClass: 'Mage',
      primordialClass: 'Versatile Adventurer',
      profession: 'Miner',
    }).ok).toBe(false);

    expect(service.delete('111').ok).toBe(true);
    expect(service.getProfile('111').ok).toBe(false);
  });
});
