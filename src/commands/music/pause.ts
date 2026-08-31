import { Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';
import { musicErrorMessage, replyMusicDisabled } from './shared.js';

export class PauseCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'pause',
      description: 'Pause the current track',
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

    const result = await music.pause(interaction.guild.id);
    if (!result.ok) {
      return interaction.reply({ content: musicErrorMessage(result.error.code), flags: EPHEMERAL });
    }
    return interaction.reply({ content: 'Paused.' });
  }
}
