import { eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { yugiohCards } from '../schema/index.js';

export type YugiohCardRow = typeof yugiohCards.$inferSelect;

export class YugiohRepository {
  public constructor(private readonly db: Database) {}

  public add(discordId: string, cardId: number, cardName: string): YugiohCardRow {
    return this.db
      .insert(yugiohCards)
      .values({
        discordId,
        cardId,
        cardName,
        caughtAt: new Date(),
      })
      .returning()
      .get();
  }

  public listByUser(discordId: string): YugiohCardRow[] {
    return this.db.select().from(yugiohCards).where(eq(yugiohCards.discordId, discordId)).all();
  }
}
