import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { adventureCustomId } from '../../domain/rpg/adventure-session.registry.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class AdventureCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'adventure',
      description: 'Start your Aethoria character creation',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const existing = this.container.characterService.getProfile(interaction.user.id);
    if (existing.ok) {
      return interaction.reply({
        content: 'You already have a character. Use `/character` or `/character-delete`.',
        flags: EPHEMERAL,
      });
    }

    const token = this.container.adventureSessionRegistry.start(interaction.user.id);
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('Begin your adventure')
      .setDescription('Create your Aethoria character. Press the button to enter a name.')
      .setFooter({ text: 'Session expires in 10 minutes' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(adventureCustomId('name', token))
        .setLabel('Enter name')
        .setStyle(ButtonStyle.Primary),
    );

    return interaction.reply({ embeds: [embed], components: [row], flags: EPHEMERAL });
  }
}
