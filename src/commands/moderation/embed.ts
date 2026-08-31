import { Command } from '@sapphire/framework';
import {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { parseHexColor } from '../../domain/embeds/embed.service.js';
import type { EmbedPayload } from '../../infrastructure/db/repositories/embed.repository.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class EmbedCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'embed',
      description: 'Create, list, preview, publish or delete saved embeds',
      preconditions: ['ModeratorOnly'],
      requiredUserPermissions: [PermissionFlagsBits.ManageMessages],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand((sub) =>
          sub
            .setName('create')
            .setDescription('Create or overwrite a saved embed')
            .addStringOption((o) => o.setName('name').setDescription('Embed name').setRequired(true))
            .addStringOption((o) => o.setName('title').setDescription('Title').setRequired(true))
            .addStringOption((o) =>
              o.setName('description').setDescription('Description').setRequired(true),
            )
            .addStringOption((o) => o.setName('color').setDescription('Hex color e.g. #5865F2'))
            .addStringOption((o) => o.setName('footer').setDescription('Footer text'))
            .addStringOption((o) => o.setName('image').setDescription('Image URL')),
        )
        .addSubcommand((sub) => sub.setName('list').setDescription('List saved embeds'))
        .addSubcommand((sub) =>
          sub
            .setName('preview')
            .setDescription('Preview a saved embed')
            .addStringOption((o) =>
              o.setName('name').setDescription('Embed name').setRequired(true).setAutocomplete(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('publish')
            .setDescription('Publish a saved embed to a channel')
            .addStringOption((o) =>
              o.setName('name').setDescription('Embed name').setRequired(true).setAutocomplete(true),
            )
            .addChannelOption((o) =>
              o
                .setName('channel')
                .setDescription('Target channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName('edit')
            .setDescription('Patch fields on a saved embed')
            .addStringOption((o) =>
              o.setName('name').setDescription('Embed name').setRequired(true).setAutocomplete(true),
            )
            .addStringOption((o) => o.setName('title').setDescription('New title'))
            .addStringOption((o) => o.setName('description').setDescription('New description'))
            .addStringOption((o) => o.setName('color').setDescription('Hex color'))
            .addStringOption((o) => o.setName('footer').setDescription('Footer text'))
            .addStringOption((o) => o.setName('image').setDescription('Image URL')),
        )
        .addSubcommand((sub) =>
          sub
            .setName('delete')
            .setDescription('Delete a saved embed')
            .addStringOption((o) =>
              o.setName('name').setDescription('Embed name').setRequired(true).setAutocomplete(true),
            ),
        ),
    );
  }

  public override async autocompleteRun(interaction: AutocompleteInteraction) {
    if (!interaction.guild) {
      return interaction.respond([]);
    }
    const focused = interaction.options.getFocused().toLowerCase();
    const names = this.container.embedService.list(interaction.guild.id);
    return interaction.respond(
      names
        .filter((name) => name.toLowerCase().includes(focused))
        .slice(0, 25)
        .map((name) => ({ name, value: name })),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'Guild only.', flags: EPHEMERAL });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const embeds = this.container.embedService;

    if (sub === 'list') {
      const names = embeds.list(guildId);
      return interaction.reply({
        content: names.length ? names.map((name) => `• \`${name}\``).join('\n') : 'No saved embeds.',
        flags: EPHEMERAL,
      });
    }

    if (sub === 'create') {
      const name = interaction.options.getString('name', true);
      const colorRaw = interaction.options.getString('color');
      const color = colorRaw ? parseHexColor(colorRaw) : 0x5865f2;
      if (colorRaw && color === null) {
        return interaction.reply({ content: 'Invalid hex color.', flags: EPHEMERAL });
      }

      const payload: EmbedPayload = {
        title: interaction.options.getString('title', true),
        description: interaction.options.getString('description', true),
      };
      if (color !== null) {
        payload.color = color;
      }
      const footer = interaction.options.getString('footer');
      if (footer) {
        payload.footer = footer;
      }
      const image = interaction.options.getString('image');
      if (image) {
        payload.imageUrl = image;
      }

      const result = embeds.create(guildId, name, payload, interaction.user.id);
      if (!result.ok) {
        return interaction.reply({ content: 'Could not save embed.', flags: EPHEMERAL });
      }

      return interaction.reply({
        content: `Embed \`${name}\` saved.`,
        embeds: [toDiscordEmbed(result.value)],
        flags: EPHEMERAL,
      });
    }

    if (sub === 'preview') {
      const name = interaction.options.getString('name', true);
      const result = embeds.get(guildId, name);
      if (!result.ok) {
        return interaction.reply({ content: 'Embed not found.', flags: EPHEMERAL });
      }
      return interaction.reply({ embeds: [toDiscordEmbed(result.value)], flags: EPHEMERAL });
    }

    if (sub === 'publish') {
      const name = interaction.options.getString('name', true);
      const channelOption = interaction.options.getChannel('channel', true);
      const result = embeds.get(guildId, name);
      if (!result.ok) {
        return interaction.reply({ content: 'Embed not found.', flags: EPHEMERAL });
      }
      const channel = await interaction.guild.channels.fetch(channelOption.id);
      if (!channel || !channel.isTextBased() || channel.isDMBased()) {
        return interaction.reply({ content: 'Invalid channel.', flags: EPHEMERAL });
      }
      await channel.send({ embeds: [toDiscordEmbed(result.value)] });
      return interaction.reply({
        content: `Published \`${name}\` to <#${channel.id}>.`,
        flags: EPHEMERAL,
      });
    }

    if (sub === 'edit') {
      const name = interaction.options.getString('name', true);
      const colorRaw = interaction.options.getString('color');
      const color = colorRaw ? parseHexColor(colorRaw) : null;
      if (colorRaw && color === null) {
        return interaction.reply({ content: 'Invalid hex color.', flags: EPHEMERAL });
      }

      const patch: EmbedPayload = {};
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const footer = interaction.options.getString('footer');
      const image = interaction.options.getString('image');
      if (title) {
        patch.title = title;
      }
      if (description) {
        patch.description = description;
      }
      if (color !== null) {
        patch.color = color;
      }
      if (footer) {
        patch.footer = footer;
      }
      if (image) {
        patch.imageUrl = image;
      }

      const result = embeds.update(guildId, name, patch, interaction.user.id);
      if (!result.ok) {
        return interaction.reply({ content: 'Embed not found.', flags: EPHEMERAL });
      }
      return interaction.reply({
        content: `Embed \`${name}\` updated.`,
        embeds: [toDiscordEmbed(result.value)],
        flags: EPHEMERAL,
      });
    }

    const name = interaction.options.getString('name', true);
    const deleted = embeds.delete(guildId, name);
    return interaction.reply({
      content: deleted.ok ? `Deleted \`${name}\`.` : 'Embed not found.',
      flags: EPHEMERAL,
    });
  }
}

function toDiscordEmbed(payload: EmbedPayload): EmbedBuilder {
  const embed = new EmbedBuilder();
  if (payload.title) {
    embed.setTitle(payload.title);
  }
  if (payload.description) {
    embed.setDescription(payload.description);
  }
  if (payload.color !== undefined) {
    embed.setColor(payload.color);
  }
  if (payload.footer) {
    embed.setFooter({ text: payload.footer });
  }
  if (payload.imageUrl) {
    embed.setImage(payload.imageUrl);
  }
  if (payload.thumbnailUrl) {
    embed.setThumbnail(payload.thumbnailUrl);
  }
  if (payload.authorName) {
    if (payload.authorIconUrl) {
      embed.setAuthor({
        name: payload.authorName,
        iconURL: payload.authorIconUrl,
      });
    } else {
      embed.setAuthor({ name: payload.authorName });
    }
  }
  for (const field of payload.fields ?? []) {
    embed.addFields(field);
  }
  if (payload.timestamp) {
    embed.setTimestamp();
  }
  return embed;
}
