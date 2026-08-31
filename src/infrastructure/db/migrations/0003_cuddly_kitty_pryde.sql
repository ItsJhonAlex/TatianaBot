CREATE TABLE `automod_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`rule_type` text NOT NULL,
	`config_json` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`discord_id` text NOT NULL,
	`name` text NOT NULL,
	`surname` text NOT NULL,
	`race` text NOT NULL,
	`gender` text NOT NULL,
	`primary_class` text NOT NULL,
	`secondary_class` text NOT NULL,
	`primordial_class` text NOT NULL,
	`profession` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`experience` integer DEFAULT 0 NOT NULL,
	`health` integer NOT NULL,
	`mana` integer NOT NULL,
	`strength` integer NOT NULL,
	`intelligence` integer NOT NULL,
	`dexterity` integer NOT NULL,
	`wisdom` integer NOT NULL,
	`charisma` integer NOT NULL,
	`constitution` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `characters_discord_id_idx` ON `characters` (`discord_id`);--> statement-breakpoint
CREATE TABLE `guild_settings` (
	`guild_id` text PRIMARY KEY NOT NULL,
	`automod_enabled` integer DEFAULT false NOT NULL,
	`log_channel_id` text,
	`mod_role_ids` text DEFAULT '[]' NOT NULL,
	`spam_threshold` integer DEFAULT 5 NOT NULL,
	`spam_interval_sec` integer DEFAULT 5 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mod_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`target_id` text NOT NULL,
	`moderator_id` text NOT NULL,
	`action_type` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saved_embeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`name` text NOT NULL,
	`payload_json` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_embeds_guild_name_idx` ON `saved_embeds` (`guild_id`,`name`);