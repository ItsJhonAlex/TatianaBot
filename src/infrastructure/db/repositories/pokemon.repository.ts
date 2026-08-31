import { eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { pokemonCatches } from '../schema/index.js';

export type PokemonCatchRow = typeof pokemonCatches.$inferSelect;

export class PokemonRepository {
  public constructor(private readonly db: Database) {}

  public add(discordId: string, pokemonId: number, pokemonName: string): PokemonCatchRow {
    return this.db
      .insert(pokemonCatches)
      .values({
        discordId,
        pokemonId,
        pokemonName,
        caughtAt: new Date(),
      })
      .returning()
      .get();
  }

  public listByUser(discordId: string): PokemonCatchRow[] {
    return this.db.select().from(pokemonCatches).where(eq(pokemonCatches.discordId, discordId)).all();
  }
}
