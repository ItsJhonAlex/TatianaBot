import { Listener } from '@sapphire/framework';
import {
  PermissionFlagsBits,
  type Message,
  type GuildMember,
  type TextChannel,
} from 'discord.js';

export class AutomodMessageListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'messageCreate',
    });
  }

  public override run(message: Message) {
    if (message.author.bot || !message.guild || !message.member) {
      return;
    }

    // Fire-and-forget so the Discord event loop is not blocked on slow actions.
    void this.handle(message).catch((error: unknown) => {
      this.container.appLogger.error({ err: error }, 'Automod handler failed');
    });
  }

  private async handle(message: Message) {
    if (!message.guild || !message.member) {
      return;
    }

    const hit = this.container.automodService.evaluateMessage({
      guildId: message.guild.id,
      userId: message.author.id,
      content: message.content,
    });
    if (!hit) {
      return;
    }

    const me = message.guild.members.me;
    await this.applyAction(message, message.member, hit.action, hit.reason, me);

    this.container.automodService.recordAction({
      guildId: message.guild.id,
      targetId: message.author.id,
      moderatorId: this.container.client.user?.id ?? '0',
      actionType: hit.action,
      reason: hit.reason,
    });

    const config = this.container.automodService.getConfig(message.guild.id);
    if (config.logChannelId) {
      const channel = await message.guild.channels.fetch(config.logChannelId).catch(() => null);
      if (channel?.isTextBased()) {
        await (channel as TextChannel).send({
          content: `Automod \`${hit.action}\` → <@${message.author.id}> (${hit.reason})`,
        });
      }
    }
  }

  private async applyAction(
    message: Message,
    member: GuildMember,
    action: string,
    reason: string,
    me: GuildMember | null,
  ) {
    if (action === 'delete' || action === 'warn' || action === 'mute') {
      if (message.deletable) {
        await message.delete().catch(() => undefined);
      }
    }

    if (action === 'warn' && message.channel.isSendable()) {
      await message.channel.send({
        content: `<@${message.author.id}>, please follow the server rules.`,
      });
      return;
    }

    if (!me?.permissions.has(PermissionFlagsBits.ModerateMembers) && action === 'mute') {
      return;
    }

    if (action === 'mute') {
      await member.timeout(10 * 60 * 1000, reason).catch(() => undefined);
      return;
    }

    if (action === 'kick' && me?.permissions.has(PermissionFlagsBits.KickMembers)) {
      await member.kick(reason).catch(() => undefined);
      return;
    }

    if (action === 'ban' && me?.permissions.has(PermissionFlagsBits.BanMembers)) {
      await member.ban({ reason }).catch(() => undefined);
    }
  }
}
