import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { bot } from '../../config/bot.js';

export class PingCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'ping',
      description: 'Muestra la latencia del bot',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const start = Date.now();
    await interaction.deferReply();
    const roundtrip = Date.now() - start;
    const wsLatency = this.container.client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🏓 Pong')
      .addFields(
        { name: 'Latencia', value: `${roundtrip.toString()} ms`, inline: true },
        { name: 'WebSocket', value: `${wsLatency.toString()} ms`, inline: true },
        { name: 'Versión', value: `v${bot.version}`, inline: true },
      )
      .setFooter({ text: bot.name });

    return interaction.editReply({ embeds: [embed] });
  }
}
