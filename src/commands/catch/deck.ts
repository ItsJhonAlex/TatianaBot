import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class DeckCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'deck',
      description: 'Show your Yu-Gi-Oh! deck',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const inventory = this.container.yugiohService.getInventory(interaction.user.id);

    if (inventory.total === 0) {
      return interaction.reply({
        content: 'Your deck is empty. Use `/yugioh` to claim cards!',
        flags: EPHEMERAL,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`${interaction.user.displayName}'s Deck`)
      .setDescription(
        inventory.entries
          .slice(0, 25)
          .map((entry) => `**${entry.name}** ×${String(entry.count)}`)
          .join('\n'),
      )
      .setFooter({ text: `Total: ${String(inventory.total)}` })
      .setAuthor({
        name: interaction.user.displayName,
        iconURL: interaction.user.displayAvatarURL(),
      });

    return interaction.reply({ embeds: [embed] });
  }
}
