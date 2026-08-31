import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Database } from '../client.js';
import { conversationMessages } from '../schema/index.js';

export type ConversationRole = 'user' | 'assistant';
export type ConversationMessageRow = typeof conversationMessages.$inferSelect;

export class ConversationRepository {
  public constructor(private readonly db: Database) {}

  public listRecent(
    guildId: string,
    userId: string,
    limit: number,
  ): ConversationMessageRow[] {
    return this.db
      .select()
      .from(conversationMessages)
      .where(
        and(eq(conversationMessages.guildId, guildId), eq(conversationMessages.userId, userId)),
      )
      .orderBy(asc(conversationMessages.createdAt))
      .all()
      .slice(-limit);
  }

  public append(
    guildId: string,
    userId: string,
    role: ConversationRole,
    content: string,
  ): ConversationMessageRow {
    return this.db
      .insert(conversationMessages)
      .values({
        guildId,
        userId,
        role,
        content,
        createdAt: new Date(),
      })
      .returning()
      .get();
  }

  public deleteOldestBeyond(guildId: string, userId: string, keep: number): void {
    const all = this.db
      .select({ id: conversationMessages.id })
      .from(conversationMessages)
      .where(
        and(eq(conversationMessages.guildId, guildId), eq(conversationMessages.userId, userId)),
      )
      .orderBy(asc(conversationMessages.createdAt))
      .all();

    if (all.length <= keep) {
      return;
    }

    const toDelete = all.slice(0, all.length - keep).map((row) => row.id);
    this.db.delete(conversationMessages).where(inArray(conversationMessages.id, toDelete)).run();
  }
}
