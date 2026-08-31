import { Listener } from '@sapphire/framework';
import { Events, type Message, type OmitPartialGroupDMChannel } from 'discord.js';
import { chunkMessage } from '../lib/chunk-message.js';

type IncomingMessage = OmitPartialGroupDMChannel<Message>;

export class ChatMentionListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.MessageCreate,
    });
  }

  public override async run(message: IncomingMessage) {
    if (message.author.bot || !message.guild) {
      return;
    }

    const botUser = message.client.user;
    const mentioned = message.mentions.users.has(botUser.id);
    const isReplyToBot = await this.isReplyToBot(message, botUser.id);

    if (!mentioned && !isReplyToBot) {
      return;
    }

    const content = message.content.replace(new RegExp(`<@!?${botUser.id}>`, 'g'), '').trim();
    if (!content) {
      await message.reply('¿En qué puedo ayudarte?');
      return;
    }

    await message.channel.sendTyping();

    try {
      const response = await this.container.chatService.reply({
        guildId: message.guild.id,
        userId: message.author.id,
        displayName: message.author.displayName,
        content,
      });

      const chunks = chunkMessage(response);
      for (const [index, chunk] of chunks.entries()) {
        if (index === 0) {
          await message.reply(chunk);
        } else {
          await message.channel.send(chunk);
        }
      }
    } catch (error: unknown) {
      this.container.appLogger.error({ err: error }, 'Error al generar respuesta de IA');
      await message.reply('No pude responder ahora. Inténtalo de nuevo en un momento.');
    }
  }

  private async isReplyToBot(message: IncomingMessage, botId: string): Promise<boolean> {
    if (!message.reference?.messageId) {
      return false;
    }

    try {
      const referenced = await message.channel.messages.fetch(message.reference.messageId);
      return referenced.author.id === botId;
    } catch {
      return false;
    }
  }
}
