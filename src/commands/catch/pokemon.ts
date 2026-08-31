import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { CATCH_REWARD_COINS, formatCatchReset } from '../../domain/catch-games/catch-game.service.js';
import { catchCustomId } from '../../domain/catch-games/catch-spawn.registry.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class PokemonCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'pokemon',
      description: 'Spawn a random Gen 1 Pokémon to catch',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const attempt = this.container.catchGameService.consumeAttempt(
      interaction.user.id,
      'pokemon',
    );

    if (!attempt.ok) {
      return interaction.reply({
        content: `No attempts left. Try again in **${formatCatchReset(attempt.error.remainingMs)}**.`,
        flags: EPHEMERAL,
      });
    }

    await interaction.deferReply();

    try {
      const spawn = await this.container.pokemonService.spawnRandom();
      const rarity = this.container.pokemonService.rarityMeta(spawn.rarity);
      const token = this.container.catchSpawnRegistry.create({
        game: 'pokemon',
        itemId: spawn.pokemonId,
        itemName: spawn.name,
        catchRate: spawn.catchRate,
      });

      const stats = spawn.stats
        .map((stat) => `**${stat.label}**: ${String(stat.value)} ${stat.short}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(rarity.color)
        .setTitle(`A wild ${spawn.name} appeared!`)
        .setDescription(
          [
            `**Type**: ${spawn.types.map((type) => `\`${type}\``).join(', ') || '`Unknown`'}`,
            `**Weight**: ${spawn.weightKg.toFixed(1)} kg`,
            '',
            '**Stats**',
            stats || '_No stats available_',
          ].join('\n'),
        )
        .addFields(
          { name: 'Rarity', value: `**${rarity.label}**`, inline: true },
          {
            name: 'Catch chance',
            value: `**${String(Math.round(spawn.catchRate * 100))}%**`,
            inline: true,
          },
          {
            name: 'Reward',
            value: `**${String(CATCH_REWARD_COINS)}** coins`,
            inline: true,
          },
        )
        .setFooter({
          text: `Requested by ${interaction.user.displayName} • Attempts left: ${String(attempt.value.remaining)}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      if (spawn.imageUrl) {
        embed.setImage(spawn.imageUrl);
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(catchCustomId(token))
          .setLabel('Catch Pokémon')
          .setStyle(ButtonStyle.Primary),
      );

      return await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: unknown) {
      this.container.appLogger.error({ err: error }, 'Failed to spawn Pokémon');
      await interaction.editReply({
        content: "Couldn't fetch a Pokémon right now. Please try again later.",
      });
    }
  }
}
