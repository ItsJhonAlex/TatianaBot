import { Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import {
  musicErrorMessage,
  replyMusicDisabled,
  replyNeedVoice,
  requireVoiceChannel,
} from './shared.js';

export class JoinCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'join',
      description: 'Join your voice channel',
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

    const voice = requireVoiceChannel(interaction);
    if (!voice || !interaction.guild) {
      return replyNeedVoice(interaction);
    }

    await interaction.deferReply();
    const result = await music.join({
      guildId: interaction.guild.id,
      channelId: voice.channel.id,
      shardId: interaction.guild.shardId,
    });

    if (!result.ok) {
      return interaction.editReply(musicErrorMessage(result.error.code));
    }

    return interaction.editReply(`Joined **${voice.channel.name}**.`);
  }
}
