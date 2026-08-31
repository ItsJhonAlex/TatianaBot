import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ButtonInteraction,
} from 'discord.js';
import { CATCH_REWARD_COINS } from '../domain/catch-games/catch-game.service.js';
import { parseCatchCustomId } from '../domain/catch-games/catch-spawn.registry.js';
import { EPHEMERAL } from '../lib/discord-flags.js';

export class CatchButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    const token = parseCatchCustomId(interaction.customId);
    if (!token) {
      return this.none();
    }
    return this.some(token);
  }

  public override async run(interaction: ButtonInteraction, token: string) {
    const spawn = this.container.catchSpawnRegistry.get(token);
    if (!spawn) {
      return interaction.reply({
        content: 'This spawn expired. Try again with a new command.',
        flags: EPHEMERAL,
      });
    }

    if (spawn.attemptedBy.has(interaction.user.id)) {
      return interaction.reply({
        content: 'You already tried to catch this one.',
        flags: EPHEMERAL,
      });
    }

    spawn.attemptedBy.add(interaction.user.id);

    const success =
      spawn.game === 'pokemon'
        ? this.container.pokemonService.tryCatch(interaction.user.id, {
            pokemonId: spawn.itemId,
            name: spawn.itemName,
            catchRate: spawn.catchRate,
          })
        : this.container.yugiohService.tryCatch(interaction.user.id, {
            cardId: spawn.itemId,
            name: spawn.itemName,
            catchRate: spawn.catchRate,
          });

    if (!success) {
      const verb = spawn.game === 'pokemon' ? 'escaped' : 'slipped away';
      return interaction.reply({
        content: `Oh no! **${spawn.itemName}** ${verb}.`,
        flags: EPHEMERAL,
      });
    }

    this.container.catchSpawnRegistry.remove(token);

    const existing = interaction.message.embeds[0];
    const embed = existing
      ? EmbedBuilder.from(existing)
          .setColor(0x2ecc71)
          .setFooter({
            text: `Caught by ${interaction.user.displayName}`,
            iconURL: interaction.user.displayAvatarURL(),
          })
      : new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle(spawn.itemName)
          .setFooter({ text: `Caught by ${interaction.user.displayName}` });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`catch-done:${token}`)
        .setLabel(spawn.game === 'pokemon' ? 'Caught!' : 'Claimed!')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
    );

    await interaction.update({ embeds: [embed], components: [row] });
    return interaction.followUp({
      content: `Nice! You got **${spawn.itemName}** and earned **${String(CATCH_REWARD_COINS)}** coins.`,
      flags: EPHEMERAL,
    });
  }
}
