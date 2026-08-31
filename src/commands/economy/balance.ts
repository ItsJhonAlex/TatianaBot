import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';

export class BalanceCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'balance',
      description: 'Shows your coin balance',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const balance = this.container.economyService.getBalance(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('💰 Your balance')
      .setDescription(`You have **${balance.toString()}** coins.`)
      .setFooter({ text: 'Use /daily to claim your daily reward' })
      .setAuthor({
        name: interaction.user.displayName,
        iconURL: interaction.user.displayAvatarURL(),
      });

    return interaction.reply({ embeds: [embed] });
  }
}
