import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { formatTrackDuration } from '../../domain/music/music.service.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';
import { replyMusicDisabled } from './shared.js';

export class QueueCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'queue',
      description: 'Show the music queue',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const music = this.container.musicService;
    if (!music) {
      return replyMusicDisabled(interaction);
    }
    if (!interaction.guild) {
      return interaction.reply({ content: 'Guild only.', flags: EPHEMERAL });
    }

    const { current, upcoming } = music.getQueue(interaction.guild.id);
    if (!current && upcoming.length === 0) {
      return interaction.reply({ content: 'The queue is empty.', flags: EPHEMERAL });
    }

    const lines: string[] = [];
    if (current) {
      lines.push(
        `**Now:** ${current.title} (\`${formatTrackDuration(current.length)}\`) — <@${current.requesterId}>`,
      );
    }
    upcoming.slice(0, 15).forEach((track, index) => {
      lines.push(
        `**${String(index + 1)}.** ${track.title} (\`${formatTrackDuration(track.length)}\`) — <@${track.requesterId}>`,
      );
    });
    if (upcoming.length > 15) {
      lines.push(`_…and ${String(upcoming.length - 15)} more_`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('Music queue')
      .setDescription(lines.join('\n'));

    return interaction.reply({ embeds: [embed] });
  }
}
