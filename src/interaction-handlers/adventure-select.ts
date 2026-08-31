import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  type StringSelectMenuInteraction,
} from 'discord.js';
import {
  adventureCustomId,
  parseAdventureCustomId,
} from '../domain/rpg/adventure-session.registry.js';
import { EPHEMERAL } from '../lib/discord-flags.js';

export class AdventureSelectHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.SelectMenu,
    });
  }

  public override parse(interaction: StringSelectMenuInteraction) {
    const parsed = parseAdventureCustomId(interaction.customId);
    if (!parsed || !['race', 'gender', 'pclass', 'sclass', 'prim', 'prof'].includes(parsed.step)) {
      return this.none();
    }
    return this.some(parsed);
  }

  public override async run(
    interaction: StringSelectMenuInteraction,
    parsed: { step: string; token: string },
  ) {
    const value = interaction.values[0];
    if (!value) {
      return interaction.reply({ content: 'No option selected.', flags: EPHEMERAL });
    }

    const session = this.container.adventureSessionRegistry.get(parsed.token);
    if (session?.discordId !== interaction.user.id) {
      return interaction.reply({ content: 'Session expired.', flags: EPHEMERAL });
    }

    if (parsed.step === 'race') {
      this.container.adventureSessionRegistry.patch(parsed.token, { raceId: value });
      return this.askSelect(
        interaction,
        parsed.token,
        'gender',
        'Choose gender',
        this.container.characterService.options().genders.map((gender) => ({
          label: gender,
          value: gender,
        })),
        draftSummary(session, { raceId: value }),
      );
    }

    if (parsed.step === 'gender') {
      this.container.adventureSessionRegistry.patch(parsed.token, { gender: value });
      return this.askSelect(
        interaction,
        parsed.token,
        'pclass',
        'Choose primary class',
        this.container.characterService.options().classes.map((name) => ({
          label: name,
          value: name,
        })),
        draftSummary(session, { gender: value }),
      );
    }

    if (parsed.step === 'pclass') {
      this.container.adventureSessionRegistry.patch(parsed.token, { primaryClass: value });
      return this.askSelect(
        interaction,
        parsed.token,
        'sclass',
        'Choose secondary class',
        this.container.characterService
          .options()
          .classes.filter((name) => name !== value)
          .map((name) => ({ label: name, value: name })),
        draftSummary(session, { primaryClass: value }),
      );
    }

    if (parsed.step === 'sclass') {
      if (value === session.primaryClass) {
        return interaction.reply({
          content: 'Secondary class must differ from primary.',
          flags: EPHEMERAL,
        });
      }
      this.container.adventureSessionRegistry.patch(parsed.token, { secondaryClass: value });
      const primordials = this.container.characterService.primordials(
        session.primaryClass ?? '',
        value,
      );
      return this.askSelect(
        interaction,
        parsed.token,
        'prim',
        'Choose primordial class',
        primordials.map((name) => ({ label: name, value: name })),
        draftSummary(session, { secondaryClass: value }),
      );
    }

    if (parsed.step === 'prim') {
      this.container.adventureSessionRegistry.patch(parsed.token, { primordialClass: value });
      return this.askSelect(
        interaction,
        parsed.token,
        'prof',
        'Choose profession',
        this.container.characterService.options().professions.map((name) => ({
          label: name,
          value: name,
        })),
        draftSummary(session, { primordialClass: value }),
      );
    }

    const draft = this.container.adventureSessionRegistry.patch(parsed.token, {
      profession: value,
    });
    if (
      !draft?.name ||
      !draft.surname ||
      !draft.raceId ||
      !draft.gender ||
      !draft.primaryClass ||
      !draft.secondaryClass ||
      !draft.primordialClass
    ) {
      return interaction.reply({ content: 'Incomplete session.', flags: EPHEMERAL });
    }

    const created = this.container.characterService.create({
      discordId: interaction.user.id,
      name: draft.name,
      surname: draft.surname,
      raceId: draft.raceId,
      gender: draft.gender,
      primaryClass: draft.primaryClass,
      secondaryClass: draft.secondaryClass,
      primordialClass: draft.primordialClass,
      profession: value,
    });

    this.container.adventureSessionRegistry.remove(parsed.token);

    if (!created.ok) {
      return interaction.update({
        content: `Could not create character: ${created.error.code}`,
        embeds: [],
        components: [],
      });
    }

    const profile = created.value;
    const bonusLines = Object.entries(profile.raceBonuses)
      .map(([stat, amount]) => `${stat} +${String(amount)}`)
      .join(', ');

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('Character created!')
      .setDescription(`**${profile.name} ${profile.surname}** is ready for Aethoria.`)
      .addFields(
        { name: 'Race', value: profile.raceName, inline: true },
        {
          name: 'Classes',
          value: `${profile.primaryClass} / ${profile.secondaryClass}`,
          inline: true,
        },
        { name: 'Primordial', value: profile.primordialClass, inline: true },
        { name: 'Profession', value: profile.profession, inline: true },
        { name: 'Race bonuses', value: bonusLines || 'None', inline: false },
        {
          name: 'Final stats',
          value: Object.entries(profile.stats)
            .map(([stat, amount]) => `**${stat}**: ${String(amount)}`)
            .join('\n'),
        },
      )
      .setFooter({ text: 'Use /character to view your profile anytime' });

    return interaction.update({ embeds: [embed], components: [] });
  }

  private askSelect(
    interaction: StringSelectMenuInteraction,
    token: string,
    step: string,
    placeholder: string,
    options: { label: string; value: string; description?: string }[],
    description: string,
  ) {
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(adventureCustomId(step, token))
        .setPlaceholder(placeholder)
        .addOptions(options.slice(0, 25)),
    );

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('Character creation')
          .setDescription(description),
      ],
      components: [row],
    });
  }
}

function draftSummary(
  session: {
    name?: string;
    surname?: string;
    raceId?: string;
    gender?: string;
    primaryClass?: string;
    secondaryClass?: string;
    primordialClass?: string;
  },
  patch: Partial<typeof session>,
): string {
  const merged = { ...session, ...patch };
  return [
    merged.name && merged.surname ? `Name: **${merged.name} ${merged.surname}**` : null,
    merged.raceId ? `Race: **${merged.raceId}**` : null,
    merged.gender ? `Gender: **${merged.gender}**` : null,
    merged.primaryClass ? `Primary: **${merged.primaryClass}**` : null,
    merged.secondaryClass ? `Secondary: **${merged.secondaryClass}**` : null,
    merged.primordialClass ? `Primordial: **${merged.primordialClass}**` : null,
    '\nChoose the next option.',
  ]
    .filter(Boolean)
    .join('\n');
}
