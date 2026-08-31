import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { bot } from '../../config/bot.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class HelpCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'help',
      description: 'Shows available commands',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const commands = [...this.container.stores.get('commands').values()]
      .filter((command) => command.supportsChatInputCommands())
      .sort((a, b) => a.name.localeCompare(b.name));

    const lines = commands.map((command) => `\`/${command.name}\` — ${command.description}`);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${bot.name} Help`)
      .setDescription(lines.join('\n') || 'No commands registered.')
      .setFooter({ text: `v${bot.version}` });

    return interaction.reply({ embeds: [embed], flags: EPHEMERAL });
  }
}
