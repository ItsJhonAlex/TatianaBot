import { and, eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { savedEmbeds } from '../schema/index.js';

export type SavedEmbedRow = typeof savedEmbeds.$inferSelect;

export interface EmbedPayload {
  title?: string;
  description?: string;
  color?: number;
  footer?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  authorName?: string;
  authorIconUrl?: string;
  fields?: { name: string; value: string; inline: boolean }[];
  timestamp?: boolean;
}

export class EmbedRepository {
  public constructor(private readonly db: Database) {}

  public find(guildId: string, name: string): SavedEmbedRow | undefined {
    return this.db
      .select()
      .from(savedEmbeds)
      .where(and(eq(savedEmbeds.guildId, guildId), eq(savedEmbeds.name, name)))
      .get();
  }

  public list(guildId: string): SavedEmbedRow[] {
    return this.db.select().from(savedEmbeds).where(eq(savedEmbeds.guildId, guildId)).all();
  }

  public upsert(
    guildId: string,
    name: string,
    payload: EmbedPayload,
    createdBy: string,
  ): SavedEmbedRow {
    const existing = this.find(guildId, name);
    const payloadJson = JSON.stringify(payload);
    if (existing) {
      return this.db
        .update(savedEmbeds)
        .set({ payloadJson, updatedAt: new Date() })
        .where(eq(savedEmbeds.id, existing.id))
        .returning()
        .get();
    }

    return this.db
      .insert(savedEmbeds)
      .values({
        guildId,
        name,
        payloadJson,
        createdBy,
        updatedAt: new Date(),
      })
      .returning()
      .get();
  }

  public delete(guildId: string, name: string): boolean {
    const existing = this.find(guildId, name);
    if (!existing) {
      return false;
    }
    this.db
      .delete(savedEmbeds)
      .where(and(eq(savedEmbeds.guildId, guildId), eq(savedEmbeds.name, name)))
      .run();
    return true;
  }
}
