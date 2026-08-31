import { Command } from '@sapphire/framework';
import {
  EmbedBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

const COOLDOWN_MS = 3_000;

export class AnimeCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'anime',
      description: 'Send an anime reaction GIF',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('Reaction type')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addUserOption((option) =>
          option.setName('user').setDescription('Target user (required for some actions)'),
        ),
    );
  }

  public override async autocompleteRun(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'action') {
      return interaction.respond([]);
    }

    const query = focused.value.toLowerCase();
    const choices = this.container.animeService
      .listActions()
      .filter(
        (action) =>
          action.id.includes(query) || action.label.toLowerCase().includes(query),
      )
      .slice(0, 25)
      .map((action) => ({ name: action.label, value: action.id }));

    return interaction.respond(choices);
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const actionId = interaction.options.getString('action', true);
    const target = interaction.options.getUser('user');
    const action = this.container.animeService.getAction(actionId);

    if (!action) {
      return interaction.reply({
        content: 'Unknown action. Pick one from the autocomplete list.',
        flags: EPHEMERAL,
      });
    }

    if (action.requiresTarget && !target) {
      return interaction.reply({
        content: `Action **${action.label}** requires a target user.`,
        flags: EPHEMERAL,
      });
    }

    const limit = this.container.rateLimiter.tryConsume(
      `${interaction.user.id}:anime`,
      COOLDOWN_MS,
    );
    if (!limit.ok) {
      const seconds = Math.ceil(limit.remainingMs / 1000);
      return interaction.reply({
        content: `Slow down! Try again in **${String(seconds)}s**.`,
        flags: EPHEMERAL,
      });
    }

    await interaction.deferReply();

    try {
      const result = await this.container.animeService.interact(
        actionId,
        interaction.user.displayName,
        target?.displayName,
      );

      const embed = new EmbedBuilder()
        .setColor(0xff69b4)
        .setDescription(result.caption)
        .setImage(result.url)
        .setFooter({
          text: result.animeName
            ? `${result.animeName} • ${interaction.user.displayName}`
            : interaction.user.displayName,
        });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error: unknown) {
      this.container.appLogger.error({ err: error }, 'Failed to fetch anime GIF');
      await interaction.editReply({
        content: "Couldn't fetch that reaction right now. Please try again later.",
      });
    }
  }
}
