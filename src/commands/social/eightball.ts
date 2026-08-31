import { Command } from '@sapphire/framework';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';

export class EightBallCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: '8ball',
      description: 'Ask the magic 8-ball a yes/no question',
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option.setName('question').setDescription('Your question').setRequired(true),
        ),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString('question', true);
    const result = this.container.eightBallService.answer(question);

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🎱 Magic 8-Ball')
      .addFields(
        { name: 'Question', value: result.question },
        { name: 'Answer', value: result.answer },
      )
      .setFooter({
        text: `Asked by ${interaction.user.displayName}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    return interaction.reply({ embeds: [embed] });
  }
}
