import type { CharacterRepository } from '../../infrastructure/db/repositories/character.repository.js';
import { err, ok, type Result } from '../../lib/result.js';
import {
  calculateStats,
  getPrimordialOptions,
  getRace,
  listClasses,
  listGenders,
  listProfessions,
  listRaces,
  type CharacterStats,
} from './stats.js';

export type CharacterError =
  | { code: 'ALREADY_EXISTS' }
  | { code: 'NOT_FOUND' }
  | { code: 'INVALID_CHOICE'; message: string };

export interface CreateCharacterInput {
  discordId: string;
  name: string;
  surname: string;
  raceId: string;
  gender: string;
  primaryClass: string;
  secondaryClass: string;
  primordialClass: string;
  profession: string;
}

export interface CharacterProfile {
  name: string;
  surname: string;
  raceId: string;
  raceName: string;
  raceBonuses: Partial<CharacterStats>;
  gender: string;
  primaryClass: string;
  secondaryClass: string;
  primordialClass: string;
  profession: string;
  level: number;
  experience: number;
  stats: CharacterStats;
}

export class CharacterService {
  public constructor(
    private readonly characters: CharacterRepository,
    private readonly random: () => number = Math.random,
  ) {}

  public create(input: CreateCharacterInput): Result<CharacterProfile, CharacterError> {
    if (this.characters.findByDiscordId(input.discordId)) {
      return err({ code: 'ALREADY_EXISTS' });
    }

    const validation = this.validateChoices(input);
    if (!validation.ok) {
      return validation;
    }

    const { stats, raceBonuses } = calculateStats({
      raceId: input.raceId,
      primaryClass: input.primaryClass,
      secondaryClass: input.secondaryClass,
      profession: input.profession,
      random: this.random,
    });

    const row = this.characters.create({
      discordId: input.discordId,
      name: input.name.trim(),
      surname: input.surname.trim(),
      race: input.raceId,
      gender: input.gender,
      primaryClass: input.primaryClass,
      secondaryClass: input.secondaryClass,
      primordialClass: input.primordialClass,
      profession: input.profession,
      level: 1,
      experience: 0,
      ...stats,
      createdAt: new Date(),
    });

    return ok(this.toProfile(row, raceBonuses));
  }

  public getProfile(discordId: string): Result<CharacterProfile, CharacterError> {
    const row = this.characters.findByDiscordId(discordId);
    if (!row) {
      return err({ code: 'NOT_FOUND' });
    }
    const race = getRace(row.race);
    return ok(this.toProfile(row, race?.bonuses ?? {}));
  }

  public delete(discordId: string): Result<true, CharacterError> {
    return this.characters.deleteByDiscordId(discordId) ? ok(true) : err({ code: 'NOT_FOUND' });
  }

  public options() {
    return {
      races: listRaces(),
      classes: listClasses(),
      professions: listProfessions(),
      genders: listGenders(),
    };
  }

  public primordials(primary: string, secondary: string): string[] {
    return getPrimordialOptions(primary, secondary);
  }

  private validateChoices(input: CreateCharacterInput): Result<true, CharacterError> {
    if (!getRace(input.raceId)) {
      return err({ code: 'INVALID_CHOICE', message: 'Invalid race' });
    }
    if (!listGenders().includes(input.gender)) {
      return err({ code: 'INVALID_CHOICE', message: 'Invalid gender' });
    }
    if (!listClasses().includes(input.primaryClass) || !listClasses().includes(input.secondaryClass)) {
      return err({ code: 'INVALID_CHOICE', message: 'Invalid class' });
    }
    if (input.primaryClass === input.secondaryClass) {
      return err({ code: 'INVALID_CHOICE', message: 'Primary and secondary class must differ' });
    }
    if (!listProfessions().includes(input.profession)) {
      return err({ code: 'INVALID_CHOICE', message: 'Invalid profession' });
    }
    const primordials = getPrimordialOptions(input.primaryClass, input.secondaryClass);
    if (!primordials.includes(input.primordialClass)) {
      return err({ code: 'INVALID_CHOICE', message: 'Invalid primordial class' });
    }
    if (!input.name.trim() || !input.surname.trim()) {
      return err({ code: 'INVALID_CHOICE', message: 'Name and surname are required' });
    }
    return ok(true);
  }

  private toProfile(
    row: {
      name: string;
      surname: string;
      race: string;
      gender: string;
      primaryClass: string;
      secondaryClass: string;
      primordialClass: string;
      profession: string;
      level: number;
      experience: number;
      health: number;
      mana: number;
      strength: number;
      intelligence: number;
      dexterity: number;
      wisdom: number;
      charisma: number;
      constitution: number;
    },
    raceBonuses: Partial<CharacterStats>,
  ): CharacterProfile {
    return {
      name: row.name,
      surname: row.surname,
      raceId: row.race,
      raceName: getRace(row.race)?.name ?? row.race,
      raceBonuses,
      gender: row.gender,
      primaryClass: row.primaryClass,
      secondaryClass: row.secondaryClass,
      primordialClass: row.primordialClass,
      profession: row.profession,
      level: row.level,
      experience: row.experience,
      stats: {
        health: row.health,
        mana: row.mana,
        strength: row.strength,
        intelligence: row.intelligence,
        dexterity: row.dexterity,
        wisdom: row.wisdom,
        charisma: row.charisma,
        constitution: row.constitution,
      },
    };
  }
}
