import type { Database } from '../client.js';
import { users } from '../schema/index.js';
import { eq } from 'drizzle-orm';

export type UserRow = typeof users.$inferSelect;

export class UserRepository {
  public constructor(private readonly db: Database) {}

  public findByDiscordId(discordId: string): UserRow | undefined {
    return this.db.select().from(users).where(eq(users.discordId, discordId)).get();
  }

  public getOrCreate(discordId: string): UserRow {
    const existing = this.findByDiscordId(discordId);
    if (existing) {
      return existing;
    }

    return this.db
      .insert(users)
      .values({
        discordId,
        balance: 0,
        createdAt: new Date(),
      })
      .returning()
      .get();
  }

  public updateBalance(discordId: string, balance: number, lastDailyAt?: Date | null): UserRow {
    const values: { balance: number; lastDailyAt?: Date | null } = { balance };
    if (lastDailyAt !== undefined) {
      values.lastDailyAt = lastDailyAt;
    }

    return this.db
      .update(users)
      .set(values)
      .where(eq(users.discordId, discordId))
      .returning()
      .get();
  }
}
