import { Listener } from '@sapphire/framework';
import { ActivityType, Events } from 'discord.js';
import { bot } from '../config/bot.js';

export class ReadyListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.ClientReady,
      once: true,
    });
  }

  public override async run() {
    const user = this.container.client.user;
    if (!user) {
      return;
    }

    const { username, id } = user;
    this.container.appLogger.info(
      { username, id, version: bot.version },
      `${bot.name} v${bot.version} conectado como ${username}`,
    );

    const clientUser = this.container.client.user;
    if (!clientUser) {
      return;
    }

    clientUser.setPresence({
      activities: [{ name: 'Siendo Tatiana', type: ActivityType.Playing }],
      status: 'online',
    });

    const statusChannelId = this.container.env.STATUS_CHANNEL_ID;
    if (statusChannelId) {
      await this.container.statusService.publishOnline(this.container.client, statusChannelId);
    }
  }
}
