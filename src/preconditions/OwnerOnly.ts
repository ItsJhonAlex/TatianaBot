import { Precondition } from '@sapphire/framework';
import type {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
} from 'discord.js';

export class OwnerOnlyPrecondition extends Precondition {
  public override chatInputRun(interaction: ChatInputCommandInteraction) {
    return this.check(interaction.user.id);
  }

  public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
    return this.check(interaction.user.id);
  }

  private check(userId: string) {
    return userId === this.container.env.AUTHORIZED_USER_ID
      ? this.ok()
      : this.error({ message: 'Solo el dueño del bot puede usar este comando.' });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    OwnerOnly: never;
  }
}
