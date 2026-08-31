import { eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { characters } from '../schema/index.js';

export type CharacterRow = typeof characters.$inferSelect;

export type CharacterInsert = Omit<typeof characters.$inferInsert, 'id'>;

export class CharacterRepository {
  public constructor(private readonly db: Database) {}

  public findByDiscordId(discordId: string): CharacterRow | undefined {
    return this.db.select().from(characters).where(eq(characters.discordId, discordId)).get();
  }

  public create(data: CharacterInsert): CharacterRow {
    return this.db.insert(characters).values(data).returning().get();
  }

  public deleteByDiscordId(discordId: string): boolean {
    const existing = this.findByDiscordId(discordId);
    if (!existing) {
      return false;
    }
    this.db.delete(characters).where(eq(characters.discordId, discordId)).run();
    return true;
  }
}
