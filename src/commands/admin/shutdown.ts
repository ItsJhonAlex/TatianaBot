import { Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { bot } from '../../config/bot.js';

export class ShutdownCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'shutdown',
      description: 'Shuts down the bot (owner only)',
      preconditions: ['OwnerOnly'],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: `🔌 ${bot.name} is shutting down...` });
    this.container.appLogger.info({ by: interaction.user.id }, 'Shutdown requested');

    setTimeout(() => {
      void this.container.client.destroy().finally(() => {
        process.exit(0);
      });
    }, 500);
  }
}
