import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
} from 'discord.js';
import {
  adventureCustomId,
  parseAdventureCustomId,
} from '../domain/rpg/adventure-session.registry.js';
import { EPHEMERAL } from '../lib/discord-flags.js';

export class AdventureNameButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    const parsed = parseAdventureCustomId(interaction.customId);
    if (parsed?.step !== 'name') {
      return this.none();
    }
    return this.some(parsed.token);
  }

  public override async run(interaction: ButtonInteraction, token: string) {
    const session = this.container.adventureSessionRegistry.get(token);
    if (session?.discordId !== interaction.user.id) {
      return interaction.reply({
        content: 'This creation session is invalid or expired.',
        flags: EPHEMERAL,
      });
    }

    /* discord.js Components V2 deprecates classic modal rows; API still accepts them. */
    /* eslint-disable @typescript-eslint/no-deprecated */
    const modal = new ModalBuilder()
      .setCustomId(adventureCustomId('namesub', token))
      .setTitle('Character name')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Name')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(32),
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('surname')
            .setLabel('Surname')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(32),
        ),
      );
    /* eslint-enable @typescript-eslint/no-deprecated */

    return interaction.showModal(modal);
  }
}
