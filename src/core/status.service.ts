import { ChannelType, EmbedBuilder, type Client, type TextBasedChannel } from 'discord.js';
import { bot } from '../config/bot.js';
import type { StatusMessageRepository } from '../infrastructure/db/repositories/status-message.repository.js';
import type { Logger } from '../lib/logger.js';

type SendableGuildText = Extract<
  TextBasedChannel,
  { type: ChannelType; send: unknown; messages: unknown }
>;

function isSendableGuildText(channel: unknown): channel is SendableGuildText {
  if (!channel || typeof channel !== 'object') {
    return false;
  }

  if (!('isTextBased' in channel) || typeof (channel as GuildBasedChannel).isTextBased !== 'function') {
    return false;
  }

  const candidate = channel as GuildBasedChannel;
  if (!candidate.isTextBased() || candidate.isDMBased()) {
    return false;
  }

  return 'send' in candidate && 'messages' in candidate;
}

interface GuildBasedChannel {
  isTextBased: () => boolean;
  isDMBased: () => boolean;
}

export class StatusService {
  public constructor(
    private readonly statuses: StatusMessageRepository,
    private readonly logger: Logger,
  ) {}

  public async publishOnline(client: Client, channelId: string): Promise<void> {
    const fetched = await client.channels.fetch(channelId).catch(() => null);
    if (!isSendableGuildText(fetched)) {
      this.logger.warn({ channelId }, 'Canal de status no encontrado o no es de texto');
      return;
    }

    const channel = fetched;

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`🟢 Estado de ${bot.name}`)
      .setDescription(`${bot.name} está **despierta**.`)
      .addFields(
        { name: 'Servidores', value: String(client.guilds.cache.size), inline: true },
        { name: 'Versión', value: `v${bot.version}`, inline: true },
      )
      .setFooter({ text: 'Última actualización' })
      .setTimestamp(new Date());

    const existingId = this.statuses.getMessageId(channelId);
    if (existingId) {
      try {
        const message = await channel.messages.fetch(existingId);
        await message.edit({ embeds: [embed] });
        return;
      } catch {
        this.logger.info('Mensaje de status previo no encontrado; creando uno nuevo');
      }
    }

    const message = await channel.send({ embeds: [embed] });
    this.statuses.upsert(channelId, message.id);
  }
}
