import { and, eq } from 'drizzle-orm';
import type { Database } from '../client.js';
import { automodRules, guildSettings, modActions } from '../schema/index.js';

export type GuildSettingsRow = typeof guildSettings.$inferSelect;
export type AutomodRuleRow = typeof automodRules.$inferSelect;
export type AutomodRuleType = AutomodRuleRow['ruleType'];

export class GuildSettingsRepository {
  public constructor(private readonly db: Database) {}

  public getOrCreate(guildId: string): GuildSettingsRow {
    const existing = this.db
      .select()
      .from(guildSettings)
      .where(eq(guildSettings.guildId, guildId))
      .get();
    if (existing) {
      return existing;
    }

    return this.db
      .insert(guildSettings)
      .values({
        guildId,
        updatedAt: new Date(),
      })
      .returning()
      .get();
  }

  public update(
    guildId: string,
    patch: Partial<{
      automodEnabled: boolean;
      logChannelId: string | null;
      modRoleIds: string;
      spamThreshold: number;
      spamIntervalSec: number;
    }>,
  ): GuildSettingsRow {
    this.getOrCreate(guildId);
    return this.db
      .update(guildSettings)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(guildSettings.guildId, guildId))
      .returning()
      .get();
  }
}

export class AutomodRuleRepository {
  public constructor(private readonly db: Database) {}

  public listEnabled(guildId: string): AutomodRuleRow[] {
    return this.db
      .select()
      .from(automodRules)
      .where(and(eq(automodRules.guildId, guildId), eq(automodRules.enabled, true)))
      .all();
  }

  public listAll(guildId: string): AutomodRuleRow[] {
    return this.db.select().from(automodRules).where(eq(automodRules.guildId, guildId)).all();
  }

  public add(guildId: string, ruleType: AutomodRuleType, config: unknown): AutomodRuleRow {
    return this.db
      .insert(automodRules)
      .values({
        guildId,
        ruleType,
        configJson: JSON.stringify(config),
        enabled: true,
        createdAt: new Date(),
      })
      .returning()
      .get();
  }

  public clearType(guildId: string, ruleType: AutomodRuleType): void {
    this.db
      .delete(automodRules)
      .where(and(eq(automodRules.guildId, guildId), eq(automodRules.ruleType, ruleType)))
      .run();
  }
}

export class ModActionRepository {
  public constructor(private readonly db: Database) {}

  public add(input: {
    guildId: string;
    targetId: string;
    moderatorId: string;
    actionType: string;
    reason: string;
  }): void {
    this.db
      .insert(modActions)
      .values({
        ...input,
        createdAt: new Date(),
      })
      .run();
  }
}
