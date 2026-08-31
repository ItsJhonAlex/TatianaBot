CREATE TABLE `catch_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`discord_id` text NOT NULL,
	`game_type` text NOT NULL,
	`attempts_remaining` integer NOT NULL,
	`last_reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `catch_attempts_user_game_idx` ON `catch_attempts` (`discord_id`,`game_type`);--> statement-breakpoint
CREATE TABLE `pokemon_catches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`discord_id` text NOT NULL,
	`pokemon_id` integer NOT NULL,
	`pokemon_name` text NOT NULL,
	`caught_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `yugioh_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`discord_id` text NOT NULL,
	`card_id` integer NOT NULL,
	`card_name` text NOT NULL,
	`caught_at` integer NOT NULL
);
