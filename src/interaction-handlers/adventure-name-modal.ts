import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type ModalSubmitInteraction,
} from 'discord.js';
import {
  adventureCustomId,
  parseAdventureCustomId,
} from '../domain/rpg/adventure-session.registry.js';
import { EPHEMERAL } from '../lib/discord-flags.js';

export class AdventureNameModalHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
    });
  }

  public override parse(interaction: ModalSubmitInteraction) {
    const parsed = parseAdventureCustomId(interaction.customId);
    if (parsed?.step !== 'namesub') {
      return this.none();
    }
    return this.some(parsed.token);
  }

  public override async run(interaction: ModalSubmitInteraction, token: string) {
    const session = this.container.adventureSessionRegistry.patch(token, {
      name: interaction.fields.getTextInputValue('name'),
      surname: interaction.fields.getTextInputValue('surname'),
    });
    if (session?.discordId !== interaction.user.id) {
      return interaction.reply({ content: 'Session expired.', flags: EPHEMERAL });
    }

    const races = this.container.characterService.options().races;
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(adventureCustomId('race', token))
        .setPlaceholder('Choose your race')
        .addOptions(
          races.map((race) => ({
            label: race.name,
            value: race.id,
            description: race.description.slice(0, 100),
          })),
        ),
    );

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('Character creation')
          .setDescription(
            `Name: **${String(session.name)} ${String(session.surname)}**\n\nChoose a race.`,
          ),
      ],
      components: [row],
      flags: EPHEMERAL,
    });
  }
}
