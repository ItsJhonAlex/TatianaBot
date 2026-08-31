import { eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { statusMessages } from '../schema/index.js';

export class StatusMessageRepository {
  public constructor(private readonly db: Database) {}

  public getMessageId(channelId: string): string | undefined {
    return this.db
      .select()
      .from(statusMessages)
      .where(eq(statusMessages.channelId, channelId))
      .get()?.messageId;
  }

  public upsert(channelId: string, messageId: string): void {
    const existing = this.getMessageId(channelId);
    if (existing) {
      this.db
        .update(statusMessages)
        .set({ messageId, updatedAt: new Date() })
        .where(eq(statusMessages.channelId, channelId))
        .run();
      return;
    }

    this.db
      .insert(statusMessages)
      .values({
        channelId,
        messageId,
        updatedAt: new Date(),
      })
      .run();
  }
}
