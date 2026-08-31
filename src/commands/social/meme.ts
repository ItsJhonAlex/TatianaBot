import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

const COOLDOWN_MS = 5_000;

export class MemeCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'meme',
      description: 'Get a random meme',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName(this.name).setDescription(this.description),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const limit = this.container.rateLimiter.tryConsume(
      `${interaction.user.id}:meme`,
      COOLDOWN_MS,
    );

    if (!limit.ok) {
      const seconds = Math.ceil(limit.remainingMs / 1000);
      return interaction.reply({
        content: `Slow down! Try again in **${String(seconds)}s**.`,
        flags: EPHEMERAL,
      });
    }

    await interaction.deferReply();

    try {
      const meme = await this.container.memeService.fetchRandom();
      const embed = new EmbedBuilder()
        .setColor(0xe67e22)
        .setTitle(meme.title.slice(0, 256))
        .setURL(meme.postLink)
        .setImage(meme.url)
        .setFooter({
          text: `r/${meme.subreddit} • u/${meme.author} • ${interaction.user.displayName}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error: unknown) {
      this.container.appLogger.error({ err: error }, 'Failed to fetch meme');
      await interaction.editReply({
        content: "Couldn't fetch a meme right now. Please try again later.",
      });
    }
  }
}
