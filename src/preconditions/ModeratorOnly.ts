import { Precondition } from '@sapphire/framework';
import {
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type ContextMenuCommandInteraction,
} from 'discord.js';

export class ModeratorOnlyPrecondition extends Precondition {
  public override chatInputRun(interaction: ChatInputCommandInteraction) {
    return this.check(interaction);
  }

  public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
    return this.check(interaction);
  }

  private check(
    interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
  ) {
    if (!interaction.inGuild() || !interaction.guild) {
      return this.error({ message: 'This command can only be used in a server.' });
    }

    const member = interaction.guild.members.resolve(interaction.user.id);
    if (!member) {
      return this.error({ message: 'Could not resolve your member profile.' });
    }

    if (
      member.permissions.has(PermissionFlagsBits.Administrator) ||
      member.permissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      return this.ok();
    }

    const settings = this.container.automodService.getConfig(interaction.guild.id);
    const hasModRole = settings.modRoleIds.some((roleId) => member.roles.cache.has(roleId));
    if (hasModRole) {
      return this.ok();
    }

    return this.error({
      message: 'You need Manage Server permission or a configured moderator role.',
    });
  }
}

declare module '@sapphire/framework' {
  interface Preconditions {
    ModeratorOnly: never;
  }
}
