import type {
  AutomodRuleRepository,
  AutomodRuleType,
  GuildSettingsRepository,
  ModActionRepository,
} from '../../infrastructure/db/repositories/moderation.repository.js';

export type AutomodAction = 'warn' | 'delete' | 'kick' | 'ban' | 'mute';

export interface AutomodHit {
  ruleType: AutomodRuleType;
  action: AutomodAction;
  reason: string;
}

export interface BannedWordsConfig {
  words: string[];
  action?: AutomodAction;
}

export interface LinksConfig {
  action?: AutomodAction;
}

const URL_PATTERN = /https?:\/\/\S+/i;

export class AutomodService {
  private readonly messageBuckets = new Map<string, number[]>();

  public constructor(
    private readonly settings: GuildSettingsRepository,
    private readonly rules: AutomodRuleRepository,
    private readonly actions: ModActionRepository,
    private readonly now: () => number = () => Date.now(),
  ) {}

  public isEnabled(guildId: string): boolean {
    return this.settings.getOrCreate(guildId).automodEnabled;
  }

  public setEnabled(guildId: string, enabled: boolean): void {
    this.settings.update(guildId, { automodEnabled: enabled });
  }

  public setLogChannel(guildId: string, channelId: string | null): void {
    this.settings.update(guildId, { logChannelId: channelId });
  }

  public setModRoles(guildId: string, roleIds: string[]): void {
    this.settings.update(guildId, { modRoleIds: JSON.stringify(roleIds) });
  }

  public setSpamConfig(guildId: string, threshold: number, intervalSec: number): void {
    this.settings.update(guildId, {
      spamThreshold: Math.max(2, threshold),
      spamIntervalSec: Math.max(1, intervalSec),
    });
    this.rules.clearType(guildId, 'spam');
    this.rules.add(guildId, 'spam', { action: 'mute' });
  }

  public addBannedWords(guildId: string, words: string[], action: AutomodAction = 'warn'): void {
    const normalized = words.map((word) => word.trim().toLowerCase()).filter(Boolean);
    this.rules.add(guildId, 'banned_words', { words: normalized, action });
  }

  public enableLinksRule(guildId: string, action: AutomodAction = 'delete'): void {
    this.rules.clearType(guildId, 'links');
    this.rules.add(guildId, 'links', { action });
  }

  public getConfig(guildId: string) {
    const settings = this.settings.getOrCreate(guildId);
    return {
      enabled: settings.automodEnabled,
      logChannelId: settings.logChannelId,
      modRoleIds: parseRoleIds(settings.modRoleIds),
      spamThreshold: settings.spamThreshold,
      spamIntervalSec: settings.spamIntervalSec,
      rules: this.rules.listAll(guildId).map((rule) => ({
        id: rule.id,
        type: rule.ruleType,
        enabled: rule.enabled,
        config: safeParse(rule.configJson),
      })),
    };
  }

  public evaluateMessage(input: {
    guildId: string;
    userId: string;
    content: string;
  }): AutomodHit | null {
    const settings = this.settings.getOrCreate(input.guildId);
    if (!settings.automodEnabled) {
      return null;
    }

    for (const rule of this.rules.listEnabled(input.guildId)) {
      const config = safeParse(rule.configJson);
      if (rule.ruleType === 'banned_words') {
        const banned = config as BannedWordsConfig;
        const words = Array.isArray(banned.words)
          ? banned.words.filter((word) => word.length > 0)
          : [];
        const lower = input.content.toLowerCase();
        if (words.some((word) => lower.includes(word))) {
          return {
            ruleType: 'banned_words',
            action: banned.action ?? 'warn',
            reason: 'Banned word detected',
          };
        }
      }

      if (rule.ruleType === 'links' && URL_PATTERN.test(input.content)) {
        return {
          ruleType: 'links',
          action: (config as LinksConfig).action ?? 'delete',
          reason: 'Unauthorized link detected',
        };
      }

      if (rule.ruleType === 'spam') {
        if (this.isSpam(input.guildId, input.userId, settings.spamThreshold, settings.spamIntervalSec)) {
          return {
            ruleType: 'spam',
            action: 'mute',
            reason: 'Spam detected',
          };
        }
      }
    }

    return null;
  }

  public recordAction(input: {
    guildId: string;
    targetId: string;
    moderatorId: string;
    actionType: string;
    reason: string;
  }): void {
    this.actions.add(input);
  }

  private isSpam(
    guildId: string,
    userId: string,
    threshold: number,
    intervalSec: number,
  ): boolean {
    const key = `${guildId}:${userId}`;
    const now = this.now();
    const windowMs = intervalSec * 1000;
    const previous = (this.messageBuckets.get(key) ?? []).filter((ts) => now - ts < windowMs);
    previous.push(now);
    this.messageBuckets.set(key, previous);
    return previous.length > threshold;
  }
}

export function parseRoleIds(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return {};
  }
}
