import { Command } from '@sapphire/framework';
import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class AutomodCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'automod',
      description: 'Configure custom automod (complements Discord AutoMod)',
      preconditions: ['ModeratorOnly'],
      requiredUserPermissions: [PermissionFlagsBits.ManageGuild],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand((sub) => sub.setName('enable').setDescription('Enable custom automod'))
        .addSubcommand((sub) => sub.setName('disable').setDescription('Disable custom automod'))
        .addSubcommand((sub) => sub.setName('status').setDescription('Show automod configuration'))
        .addSubcommand((sub) =>
          sub
            .setName('set-log')
            .setDescription('Set the automod log channel')
            .addChannelOption((option) =>
              option
                .setName('channel')
                .setDescription('Log channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('set-roles')
            .setDescription('Set moderator roles (comma-separated IDs)')
            .addStringOption((option) =>
              option.setName('role_ids').setDescription('Role IDs separated by commas').setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('add-words')
            .setDescription('Add a banned-words rule')
            .addStringOption((option) =>
              option.setName('words').setDescription('Comma-separated words').setRequired(true),
            )
            .addStringOption((option) =>
              option
                .setName('action')
                .setDescription('Action to apply')
                .addChoices(
                  { name: 'warn', value: 'warn' },
                  { name: 'delete', value: 'delete' },
                  { name: 'mute', value: 'mute' },
                  { name: 'kick', value: 'kick' },
                  { name: 'ban', value: 'ban' },
                ),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('links')
            .setDescription('Enable link filtering')
            .addStringOption((option) =>
              option
                .setName('action')
                .setDescription('Action to apply')
                .addChoices(
                  { name: 'delete', value: 'delete' },
                  { name: 'warn', value: 'warn' },
                  { name: 'mute', value: 'mute' },
                ),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('spam')
            .setDescription('Configure spam detection')
            .addIntegerOption((option) =>
              option.setName('threshold').setDescription('Max messages in the window').setRequired(true).setMinValue(2),
            )
            .addIntegerOption((option) =>
              option
                .setName('interval')
                .setDescription('Window in seconds')
                .setRequired(true)
                .setMinValue(1),
            ),
        ),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'Guild only.', flags: EPHEMERAL });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const automod = this.container.automodService;

    if (sub === 'enable') {
      automod.setEnabled(guildId, true);
      return interaction.reply({
        content:
          'Custom automod enabled. Prefer Discord native AutoMod for keyword filters when possible; this bot handles spam/links/logging as a complement.',
        flags: EPHEMERAL,
      });
    }

    if (sub === 'disable') {
      automod.setEnabled(guildId, false);
      return interaction.reply({ content: 'Custom automod disabled.', flags: EPHEMERAL });
    }

    if (sub === 'set-log') {
      const channel = interaction.options.getChannel('channel', true);
      automod.setLogChannel(guildId, channel.id);
      return interaction.reply({ content: `Log channel set to <#${channel.id}>.`, flags: EPHEMERAL });
    }

    if (sub === 'set-roles') {
      const raw = interaction.options.getString('role_ids', true);
      const roleIds = raw
        .split(',')
        .map((value) => value.trim())
        .filter((value) => /^\d+$/.test(value));
      automod.setModRoles(guildId, roleIds);
      return interaction.reply({
        content: `Moderator roles updated (${String(roleIds.length)}).`,
        flags: EPHEMERAL,
      });
    }

    if (sub === 'add-words') {
      const words = interaction.options.getString('words', true).split(',');
      const action = (interaction.options.getString('action') ?? 'warn') as
        | 'warn'
        | 'delete'
        | 'mute'
        | 'kick'
        | 'ban';
      automod.addBannedWords(guildId, words, action);
      return interaction.reply({ content: 'Banned-words rule added.', flags: EPHEMERAL });
    }

    if (sub === 'links') {
      const action = (interaction.options.getString('action') ?? 'delete') as 'delete' | 'warn' | 'mute';
      automod.enableLinksRule(guildId, action);
      return interaction.reply({ content: 'Links rule enabled.', flags: EPHEMERAL });
    }

    if (sub === 'spam') {
      const threshold = interaction.options.getInteger('threshold', true);
      const interval = interaction.options.getInteger('interval', true);
      automod.setSpamConfig(guildId, threshold, interval);
      return interaction.reply({
        content: `Spam config updated: ${String(threshold)} messages / ${String(interval)}s.`,
        flags: EPHEMERAL,
      });
    }

    const config = automod.getConfig(guildId);
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Custom Automod')
      .setDescription(
        'Tip: use Discord Server Settings → AutoMod for native keyword/mention spam rules. This bot adds custom words/spam/links + audit log.',
      )
      .addFields(
        { name: 'Status', value: config.enabled ? 'Enabled' : 'Disabled', inline: true },
        {
          name: 'Log channel',
          value: config.logChannelId ? `<#${config.logChannelId}>` : 'Not set',
          inline: true,
        },
        {
          name: 'Mod roles',
          value: config.modRoleIds.map((id) => `<@&${id}>`).join(', ') || 'None',
          inline: false,
        },
        {
          name: 'Spam',
          value: `${String(config.spamThreshold)} msgs / ${String(config.spamIntervalSec)}s`,
          inline: true,
        },
        {
          name: 'Rules',
          value:
            config.rules.map((rule) => `\`${rule.type}\` (#${String(rule.id)})`).join('\n') ||
            'None',
          inline: false,
        },
      );

    return interaction.reply({ embeds: [embed], flags: EPHEMERAL });
  }
}
