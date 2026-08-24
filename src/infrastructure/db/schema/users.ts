import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  discordId: text('discord_id').notNull().unique(),
  balance: integer('balance').notNull().default(0),
  lastDailyAt: integer('last_daily_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const statusMessages = sqliteTable('status_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  channelId: text('channel_id').notNull().unique(),
  messageId: text('message_id').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});
