import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const guildSettings = sqliteTable('guild_settings', {
  guildId: text('guild_id').primaryKey(),
  automodEnabled: integer('automod_enabled', { mode: 'boolean' }).notNull().default(false),
  logChannelId: text('log_channel_id'),
  modRoleIds: text('mod_role_ids').notNull().default('[]'),
  spamThreshold: integer('spam_threshold').notNull().default(5),
  spamIntervalSec: integer('spam_interval_sec').notNull().default(5),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const automodRules = sqliteTable('automod_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  guildId: text('guild_id').notNull(),
  ruleType: text('rule_type', { enum: ['banned_words', 'spam', 'links'] }).notNull(),
  configJson: text('config_json').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const modActions = sqliteTable('mod_actions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  guildId: text('guild_id').notNull(),
  targetId: text('target_id').notNull(),
  moderatorId: text('moderator_id').notNull(),
  actionType: text('action_type').notNull(),
  reason: text('reason').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const savedEmbeds = sqliteTable(
  'saved_embeds',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    guildId: text('guild_id').notNull(),
    name: text('name').notNull(),
    payloadJson: text('payload_json').notNull(),
    createdBy: text('created_by').notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('saved_embeds_guild_name_idx').on(table.guildId, table.name)],
);

export const characters = sqliteTable(
  'characters',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    discordId: text('discord_id').notNull(),
    name: text('name').notNull(),
    surname: text('surname').notNull(),
    race: text('race').notNull(),
    gender: text('gender').notNull(),
    primaryClass: text('primary_class').notNull(),
    secondaryClass: text('secondary_class').notNull(),
    primordialClass: text('primordial_class').notNull(),
    profession: text('profession').notNull(),
    level: integer('level').notNull().default(1),
    experience: integer('experience').notNull().default(0),
    health: integer('health').notNull(),
    mana: integer('mana').notNull(),
    strength: integer('strength').notNull(),
    intelligence: integer('intelligence').notNull(),
    dexterity: integer('dexterity').notNull(),
    wisdom: integer('wisdom').notNull(),
    charisma: integer('charisma').notNull(),
    constitution: integer('constitution').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('characters_discord_id_idx').on(table.discordId)],
);
