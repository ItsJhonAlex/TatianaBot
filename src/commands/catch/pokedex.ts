import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class PokedexCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'pokedex',
      description: 'Show your caught Pokémon',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const inventory = this.container.pokemonService.getInventory(interaction.user.id);

    if (inventory.total === 0) {
      return interaction.reply({
        content: 'Your Pokédex is empty. Use `/pokemon` to catch some!',
        flags: EPHEMERAL,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`${interaction.user.displayName}'s Pokédex`)
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
