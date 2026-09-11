import { Command } from '@sapphire/framework';
import {
  EmbedBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { bot } from '../../config/bot.js';
import { formatChangelogBody } from '../../domain/changelog/changelog.service.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

export class ChangelogCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'changelog',
      description: 'Shows release notes from CHANGELOG.md',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName('version')
            .setDescription('Specific version (e.g. 2.5.0). Default: latest')
            .setRequired(false)
            .setAutocomplete(true),
        ),
    );
  }

  public override async autocompleteRun(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused().trim().replace(/^v/i, '');
    const listed = await this.container.changelogService.listEntries();
    if (!listed.ok) {
      return interaction.respond([]);
    }

    const choices = listed.value
      .filter((entry) => !focused || entry.version.startsWith(focused))
      .slice(0, 25)
      .map((entry) => ({
        name: entry.date ? `v${entry.version} — ${entry.date}` : `v${entry.version}`,
        value: entry.version,
      }));

    return interaction.respond(choices);
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const version = interaction.options.getString('version');

    if (version) {
      const result = await this.container.changelogService.getVersion(version);
      if (!result.ok) {
        const message =
          result.error.code === 'NOT_FOUND'
            ? `No encontré la versión \`${version}\`.`
            : 'No pude leer el changelog.';
        return interaction.reply({ content: message, flags: EPHEMERAL });
      }

      return interaction.reply({ embeds: [this.toEmbed(result.value)] });
    }

    const latest = await this.container.changelogService.getLatest(1);
    if (!latest.ok || latest.value.length === 0) {
      return interaction.reply({
        content: 'No hay entradas en el changelog.',
        flags: EPHEMERAL,
      });
    }

    const entry = latest.value[0];
    if (!entry) {
      return interaction.reply({
        content: 'No hay entradas en el changelog.',
        flags: EPHEMERAL,
      });
    }
    const listed = await this.container.changelogService.listEntries();
    const recent =
      listed.ok
        ? listed.value
            .slice(0, 5)
            .map((item) => `\`v${item.version}\`${item.date ? ` (${item.date})` : ''}`)
            .join('\n')
        : null;

    const embed = this.toEmbed(entry);
    if (recent) {
      embed.addFields({ name: 'Recientes', value: recent });
    }

    return interaction.reply({ embeds: [embed] });
  }

  private toEmbed(entry: { version: string; date: string | null; body: string }) {
    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${bot.name} v${entry.version}`)
      .setDescription(formatChangelogBody(entry.body))
      .setFooter({
        text: entry.date
          ? `Publicado ${entry.date} · no despliega código`
          : 'Notas de versión · no despliega código',
      });
  }
}
