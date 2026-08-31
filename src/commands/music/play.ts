import { Command } from '@sapphire/framework';
import {
  EmbedBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { formatTrackDuration } from '../../domain/music/music.service.js';
import {
  musicErrorMessage,
  replyMusicDisabled,
  replyNeedVoice,
  requireVoiceChannel,
} from './shared.js';

const AUTOCOMPLETE_COOLDOWN_MS = 800;

export class PlayCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'play',
      description: 'Play a song or add it to the queue',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('query')
            .setDescription('Search as you type (YouTube), or paste a URL')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    );
  }

  public override async autocompleteRun(interaction: AutocompleteInteraction) {
    const music = this.container.musicService;
    if (!music) {
      return interaction.respond([]);
    }

    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'query') {
      return interaction.respond([]);
    }

    const query = focused.value.trim();
    if (query.length < 2) {
      return interaction.respond([]);
    }

    const limit = this.container.rateLimiter.tryConsume(
      `${interaction.user.id}:play:autocomplete`,
      AUTOCOMPLETE_COOLDOWN_MS,
    );
    if (!limit.ok) {
      return interaction.respond([]);
    }

    const result = await music.searchSuggestions(query);
    if (!result.ok) {
      return interaction.respond([]);
    }

    return interaction.respond(result.value.slice(0, 25));
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const music = this.container.musicService;
    if (!music) {
      return replyMusicDisabled(interaction);
    }

    const voice = requireVoiceChannel(interaction);
    if (!voice || !interaction.guild) {
      return replyNeedVoice(interaction);
    }

    const query = interaction.options.getString('query', true);
    await interaction.deferReply();

    const result = await music.play({
      guildId: interaction.guild.id,
      channelId: voice.channel.id,
      shardId: interaction.guild.shardId,
      query,
      requesterId: interaction.user.id,
    });

    if (!result.ok) {
      const message =
        result.error.code === 'RESOLVE_FAILED'
          ? musicErrorMessage(result.error.code, result.error.message)
          : musicErrorMessage(result.error.code);
      return interaction.editReply(message);
    }

    const { track, queued } = result.value;
    const embed = new EmbedBuilder()
      .setColor(queued ? 0x3498db : 0x2ecc71)
      .setTitle(queued ? 'Added to queue' : 'Now playing')
      .setDescription(
        track.uri ? `**[${track.title}](${track.uri})**` : `**${track.title}**`,
      )
      .addFields(
        { name: 'Author', value: track.author, inline: true },
        { name: 'Duration', value: formatTrackDuration(track.length), inline: true },
        { name: 'Requested by', value: `<@${track.requesterId}>`, inline: true },
      );

    return interaction.editReply({ embeds: [embed] });
  }
}
