import { Command } from '@sapphire/framework';
import {
  EmbedBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class LoreCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'lore',
      description: 'Look up Aethoria lore',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('query')
            .setDescription('Search term or category')
            .setRequired(false)
            .setAutocomplete(true),
        ),
    );
  }

  public override async autocompleteRun(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const lore = this.container.loreService;
    const suggestions = [
      ...lore.listCategories().map((category) => ({ name: `category:${category}`, value: category })),
      ...lore.search(focused || 'a').slice(0, 15).map((entry) => ({
        name: `${entry.name} (${entry.category})`.slice(0, 100),
        value: entry.name.slice(0, 100),
      })),
    ]
      .filter((item) => item.name.toLowerCase().includes(focused) || item.value.toLowerCase().includes(focused))
      .slice(0, 25);

    return interaction.respond(suggestions);
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('query');
    const lore = this.container.loreService;

    if (!query) {
      const overview = lore.overview();
      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(overview.world)
        .setDescription(overview.description)
        .addFields({
          name: 'Categories',
          value: overview.categories.map((category) => `\`${category}\``).join(', '),
        })
        .setFooter({ text: 'Try /lore query:Lumina' });
      return interaction.reply({ embeds: [embed], flags: EPHEMERAL });
    }

    const byCategory = lore.byCategory(query);
    const results = byCategory.length > 0 ? byCategory : lore.search(query);
    if (results.length === 0) {
      return interaction.reply({ content: 'No lore entries found.', flags: EPHEMERAL });
    }

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`Lore: ${query}`)
      .setDescription(
        results
          .slice(0, 8)
          .map((entry) => {
            const meta = entry.meta ? ` _( ${entry.meta})_` : '';
            return `**${entry.name}**${meta}\n${entry.description}`;
          })
          .join('\n\n')
          .slice(0, 4096),
      );

    return interaction.reply({ embeds: [embed] });
  }
}
