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

export class YugiohCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'yugioh',
      description: 'Spawn a random Yu-Gi-Oh! card to claim',
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
      'yugioh',
    );

    if (!attempt.ok) {
      return interaction.reply({
        content: `No attempts left. Try again in **${formatCatchReset(attempt.error.remainingMs)}**.`,
        flags: EPHEMERAL,
      });
    }

    await interaction.deferReply();

    try {
      const spawn = await this.container.yugiohService.spawnRandom();
      const token = this.container.catchSpawnRegistry.create({
        game: 'yugioh',
        itemId: spawn.cardId,
        itemName: spawn.name,
        catchRate: spawn.catchRate,
      });

      const lines = [
        `**Type**: \`${spawn.type}\``,
        `**Race**: \`${spawn.race}\``,
      ];
      if (spawn.archetype) {
        lines.push(`**Archetype**: \`${spawn.archetype}\``);
      }
      lines.push('', spawn.description);

      const embed = new EmbedBuilder()
        .setColor(spawn.color)
        .setTitle(`${spawn.name} appeared!`)
        .setDescription(lines.join('\n').slice(0, 4096))
        .addFields(
          { name: 'Price', value: `$${spawn.price.toFixed(2)}`, inline: true },
          { name: 'Rarity', value: `**${spawn.rarityLabel}**`, inline: true },
          {
            name: 'Claim chance',
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

      const combat: string[] = [];
      if (spawn.atk !== null) {
        combat.push(`ATK **${String(spawn.atk)}**`);
      }
      if (spawn.def !== null) {
        combat.push(`DEF **${String(spawn.def)}**`);
      }
      if (spawn.level !== null) {
        combat.push(`Level **${String(spawn.level)}**`);
      }
      if (combat.length > 0) {
        embed.addFields({ name: 'Stats', value: combat.join(' • '), inline: false });
      }

      if (spawn.imageUrl) {
        embed.setImage(spawn.imageUrl);
      }

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(catchCustomId(token))
          .setLabel('Claim Card')
          .setStyle(ButtonStyle.Primary),
      );

      return await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error: unknown) {
      this.container.appLogger.error({ err: error }, 'Failed to spawn Yu-Gi-Oh! card');
      await interaction.editReply({
        content: "Couldn't fetch a card right now. Please try again later.",
      });
    }
  }
}
