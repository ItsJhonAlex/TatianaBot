import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { bot } from '../../config/bot.js';
import { formatUptime } from '../../core/metrics.service.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class StatsCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'stats',
      description: 'Shows bot uptime and basic command metrics',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const snap = this.container.metricsService.snapshot();
    const guilds = this.container.client.guilds.cache.size;
    const wsLatency = this.container.client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${bot.name} — métricas`)
      .addFields(
        { name: 'Uptime', value: formatUptime(snap.uptimeMs), inline: true },
        { name: 'Servidores', value: String(guilds), inline: true },
        { name: 'Versión', value: `v${bot.version}`, inline: true },
        {
          name: 'Comandos (último min)',
          value: String(snap.commandsLastMinute),
          inline: true,
        },
        {
          name: 'Promedio / min',
          value: String(snap.commandsPerMinute),
          inline: true,
        },
        { name: 'Total (sesión)', value: String(snap.totalCommands), inline: true },
        { name: 'WebSocket', value: `${String(wsLatency)} ms`, inline: true },
      )
      .setFooter({ text: 'Métricas en memoria · se reinician al reiniciar el bot' })
      .setTimestamp(new Date());

    return interaction.reply({ embeds: [embed], flags: EPHEMERAL });
  }
}
