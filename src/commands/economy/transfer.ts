import { Command } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';

export class TransferCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'transfer',
      description: 'Transfer coins to another user',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option.setName('user').setDescription('Recipient user').setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('Amount of coins')
            .setRequired(true)
            .setMinValue(1),
        ),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    if (target.bot) {
      return interaction.reply({
        content: "You can't transfer coins to a bot.",
        ephemeral: true,
      });
    }

    const result = this.container.economyService.transfer(
      interaction.user.id,
      target.id,
      amount,
    );

    if (!result.ok) {
      let content = 'Transfer failed.';
      switch (result.error.code) {
        case 'SELF_TRANSFER':
          content = "You can't transfer coins to yourself.";
          break;
        case 'INVALID_AMOUNT':
          content = 'Amount must be a positive integer.';
          break;
        case 'INSUFFICIENT_FUNDS':
          content = `Insufficient funds. Your balance is **${result.error.balance.toString()}**.`;
          break;
        case 'INTERNAL':
          content = "Couldn't complete the transfer.";
          break;
      }

      return interaction.reply({ content, ephemeral: true });
    }

    return interaction.reply({
      content: `Transferred **${result.value.amount.toString()}** coins to ${target.toString()}. Your balance: **${result.value.fromBalance.toString()}**.`,
    });
  }
}
