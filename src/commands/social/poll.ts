import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { EPHEMERAL } from '../../lib/discord-flags.js';

const EMOJI_OPTIONS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'] as const;

export class PollCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'poll',
      description: 'Create a quick reaction poll',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option.setName('question').setDescription('Poll question').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('options')
            .setDescription('Comma-separated options (2–10)')
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString('question', true).trim();
    const options = interaction.options
      .getString('options', true)
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (options.length < 2) {
      return interaction.reply({
        content: 'Provide at least 2 options, separated by commas.',
        flags: EPHEMERAL,
      });
    }

    if (options.length > 10) {
      return interaction.reply({
        content: 'Maximum of 10 options allowed.',
        flags: EPHEMERAL,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('📊 Poll')
      .setDescription(question)
      .setFooter({ text: `Created by ${interaction.user.displayName}` });

    for (const [index, option] of options.entries()) {
      const emoji = EMOJI_OPTIONS[index];
      if (!emoji) {
        break;
      }
      embed.addFields({ name: `Option ${String(index + 1)}`, value: `${emoji} ${option}` });
    }

    await interaction.reply({ embeds: [embed] });
    const message = await interaction.fetchReply();

    for (let i = 0; i < options.length; i++) {
      const emoji = EMOJI_OPTIONS[i];
      if (emoji) {
        await message.react(emoji);
      }
    }
  }
}
