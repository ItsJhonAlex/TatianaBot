import { Listener, Events } from '@sapphire/framework';

export class CommandMetricsListener extends Listener {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.ChatInputCommandFinish,
    });
  }

  public override run() {
    this.container.metricsService.recordCommand();
  }
}
