import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const catchAttempts = sqliteTable(
  'catch_attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    discordId: text('discord_id').notNull(),
    gameType: text('game_type', { enum: ['pokemon', 'yugioh'] }).notNull(),
    attemptsRemaining: integer('attempts_remaining').notNull(),
    lastResetAt: integer('last_reset_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [uniqueIndex('catch_attempts_user_game_idx').on(table.discordId, table.gameType)],
);

export const pokemonCatches = sqliteTable('pokemon_catches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  discordId: text('discord_id').notNull(),
  pokemonId: integer('pokemon_id').notNull(),
  pokemonName: text('pokemon_name').notNull(),
  caughtAt: integer('caught_at', { mode: 'timestamp_ms' }).notNull(),
});

export const yugiohCards = sqliteTable('yugioh_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  discordId: text('discord_id').notNull(),
  cardId: integer('card_id').notNull(),
  cardName: text('card_name').notNull(),
  caughtAt: integer('caught_at', { mode: 'timestamp_ms' }).notNull(),
});
