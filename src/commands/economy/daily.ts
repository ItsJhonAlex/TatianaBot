import { Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { formatRemaining } from '../../domain/economy/economy.service.js';

export class DailyCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'daily',
      description: 'Claim your daily coin reward',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const result = this.container.economyService.claimDaily(interaction.user.id);

    if (!result.ok) {
      if (result.error.code === 'COOLDOWN') {
        return interaction.reply({
          content: `You can't claim yet. Time remaining: **${formatRemaining(result.error.remainingMs)}**`,
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: "Couldn't claim the reward. Please try again later.",
        ephemeral: true,
      });
    }

    return interaction.reply({
      content: `You claimed **${result.value.amount.toString()}** coins! Balance: **${result.value.balance.toString()}**.`,
    });
  }
}
