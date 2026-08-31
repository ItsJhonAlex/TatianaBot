import { and, eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { catchAttempts } from '../schema/index.js';

export type CatchGameType = 'pokemon' | 'yugioh';
export type CatchAttemptRow = typeof catchAttempts.$inferSelect;

export class CatchAttemptRepository {
  public constructor(private readonly db: Database) {}

  public find(discordId: string, gameType: CatchGameType): CatchAttemptRow | undefined {
    return this.db
      .select()
      .from(catchAttempts)
      .where(and(eq(catchAttempts.discordId, discordId), eq(catchAttempts.gameType, gameType)))
      .get();
  }

  public upsert(row: {
    discordId: string;
    gameType: CatchGameType;
    attemptsRemaining: number;
    lastResetAt: Date;
  }): CatchAttemptRow {
    const existing = this.find(row.discordId, row.gameType);
    if (existing) {
      return this.db
        .update(catchAttempts)
        .set({
          attemptsRemaining: row.attemptsRemaining,
          lastResetAt: row.lastResetAt,
        })
        .where(eq(catchAttempts.id, existing.id))
        .returning()
        .get();
    }

    return this.db.insert(catchAttempts).values(row).returning().get();
  }
}
