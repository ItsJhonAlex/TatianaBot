import { Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';
import { musicErrorMessage, replyMusicDisabled } from './shared.js';

export class SkipCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'skip',
      description: 'Skip the current track',
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

    const result = await music.skip(interaction.guild.id);
    if (!result.ok) {
      return interaction.reply({ content: musicErrorMessage(result.error.code), flags: EPHEMERAL });
    }

    const title = result.value.skipped?.title;
    return interaction.reply({
      content: title ? `Skipped **${title}**.` : 'Skipped.',
    });
  }
}
