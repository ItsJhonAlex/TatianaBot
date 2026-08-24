import { Listener } from '@sapphire/framework';
import { Events } from 'discord.js';
import { bot } from '../config/bot.js';

export class ReadyListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.ClientReady,
      once: true,
    });
  }

  public override run() {
    const user = this.container.client.user;
    if (!user) {
      return;
    }

    const { username, id } = user;
    this.container.appLogger.info(
      { username, id, version: bot.version },
      `${bot.name} v${bot.version} conectado como ${username}`,
    );
  }
}
