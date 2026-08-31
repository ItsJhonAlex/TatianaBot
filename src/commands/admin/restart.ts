import { Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { bot } from '../../config/bot.js';

export class RestartCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'restart',
      description: 'Restarts the bot (owner only)',
      preconditions: ['OwnerOnly'],
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: `🔄 ${bot.name} is restarting...` });
    this.container.appLogger.info({ by: interaction.user.id }, 'Restart requested');

    setTimeout(() => {
      void this.container.client.destroy().finally(() => {
        const subprocess = Bun.spawn([process.execPath, ...process.argv.slice(1)], {
          cwd: process.cwd(),
          env: process.env,
          stdio: ['inherit', 'inherit', 'inherit'],
        });
        this.container.appLogger.info({ pid: subprocess.pid }, 'Child process spawned');
        process.exit(0);
      });
    }, 500);
  }
}
