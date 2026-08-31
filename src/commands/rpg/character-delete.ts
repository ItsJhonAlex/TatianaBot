import { Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class CharacterDeleteCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'character-delete',
      description: 'Delete your Aethoria character',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const result = this.container.characterService.delete(interaction.user.id);
    return interaction.reply({
      content: result.ok
        ? 'Character deleted. Use `/adventure` to start again.'
        : 'You do not have a character to delete.',
      flags: EPHEMERAL,
    });
  }
}
