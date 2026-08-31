import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class CharacterCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'character',
      description: 'Show your Aethoria character profile',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const result = this.container.characterService.getProfile(interaction.user.id);
    if (!result.ok) {
      return interaction.reply({
        content: 'No character yet. Use `/adventure` to create one.',
        flags: EPHEMERAL,
      });
    }

    const profile = result.value;
    const balance = this.container.economyService.getBalance(interaction.user.id);
    const bonusLines = Object.entries(profile.raceBonuses)
      .map(([stat, value]) => `• ${stat}: **+${String(value)}**`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`${profile.name} ${profile.surname}`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: 'Gender', value: profile.gender, inline: true },
        { name: 'Race', value: profile.raceName, inline: true },
        { name: 'Profession', value: profile.profession, inline: true },
        { name: 'Primary', value: profile.primaryClass, inline: true },
        { name: 'Secondary', value: profile.secondaryClass, inline: true },
        { name: 'Primordial', value: profile.primordialClass, inline: true },
        { name: 'Level', value: String(profile.level), inline: true },
        { name: 'XP', value: String(profile.experience), inline: true },
        { name: 'Coins', value: String(balance), inline: true },
        {
          name: 'Stats',
          value: [
            `❤️ HP ${String(profile.stats.health)}`,
            `🔮 Mana ${String(profile.stats.mana)}`,
            `💪 STR ${String(profile.stats.strength)}`,
            `🧠 INT ${String(profile.stats.intelligence)}`,
            `🏃 DEX ${String(profile.stats.dexterity)}`,
            `🦉 WIS ${String(profile.stats.wisdom)}`,
            `🗣️ CHA ${String(profile.stats.charisma)}`,
            `🏋️ CON ${String(profile.stats.constitution)}`,
          ].join('\n'),
        },
        {
          name: 'Race bonuses (applied)',
          value: bonusLines || 'None',
        },
      );

    return interaction.reply({ embeds: [embed] });
  }
}
