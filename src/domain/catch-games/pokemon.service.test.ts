import { describe, expect, it } from 'bun:test';
import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../infrastructure/db/schema/index.js';
import { PokemonRepository } from '../../infrastructure/db/repositories/pokemon.repository.js';
import { UserRepository } from '../../infrastructure/db/repositories/user.repository.js';
import { HttpClient } from '../../infrastructure/http/http-client.js';
import { CATCH_REWARD_COINS } from './catch-game.service.js';
import { PokemonService } from './pokemon.service.js';

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

describe('PokemonService', () => {
  it('captura exitosa añade inventario y monedas', () => {
    const db = createTestDb();
    const users = new UserRepository(db);
    const pokemon = new PokemonRepository(db);
    const service = new PokemonService(new HttpClient(), pokemon, users, () => 0);

    const ok = service.tryCatch('111', {
      pokemonId: 25,
      name: 'Pikachu',
      catchRate: 1,
    });

    expect(ok).toBe(true);
    expect(service.getInventory('111').total).toBe(1);
    expect(users.getOrCreate('111').balance).toBe(CATCH_REWARD_COINS);
  });

  it('captura fallida no modifica inventario', () => {
    const db = createTestDb();
    const users = new UserRepository(db);
    const pokemon = new PokemonRepository(db);
    const service = new PokemonService(new HttpClient(), pokemon, users, () => 0.99);

    const ok = service.tryCatch('111', {
      pokemonId: 25,
      name: 'Pikachu',
      catchRate: 0.5,
    });

    expect(ok).toBe(false);
    expect(service.getInventory('111').total).toBe(0);
    expect(users.getOrCreate('111').balance).toBe(0);
  });
});
