import catalog from '../../content/rpg/catalog.json';

export type StatKey =
  | 'health'
  | 'mana'
  | 'strength'
  | 'intelligence'
  | 'dexterity'
  | 'wisdom'
  | 'charisma'
  | 'constitution';

export type CharacterStats = Record<StatKey, number>;

export interface RaceDef {
  id: string;
  name: string;
  description: string;
  bonuses: Partial<CharacterStats>;
}

const BASE_STATS: CharacterStats = {
  health: 100,
  mana: 50,
  strength: 10,
  intelligence: 10,
  dexterity: 10,
  wisdom: 10,
  charisma: 10,
  constitution: 10,
};

export function listRaces(): RaceDef[] {
  return catalog.races;
}

export function getRace(id: string): RaceDef | undefined {
  return listRaces().find((race) => race.id === id);
}

export function listClasses(): string[] {
  return catalog.classes;
}

export function listProfessions(): string[] {
  return catalog.professions;
}

export function listGenders(): string[] {
  return catalog.genders;
}

export function getPrimordialOptions(primary: string, secondary: string): string[] {
  const key = `${primary}+${secondary}`;
  const reverse = `${secondary}+${primary}`;
  const map = catalog as {
    primordialDefaults: string[];
    primordialCombos?: Record<string, string[]>;
  };
  return map.primordialCombos?.[key] ?? map.primordialCombos?.[reverse] ?? map.primordialDefaults;
}

export function calculateStats(input: {
  raceId: string;
  primaryClass: string;
  secondaryClass: string;
  profession: string;
  random: () => number;
}): { stats: CharacterStats; raceBonuses: Partial<CharacterStats> } {
  const stats: CharacterStats = { ...BASE_STATS };
  const classMods = catalog.classModifiers as Record<string, Partial<CharacterStats>>;
  const professionMods = catalog.professionModifiers as Record<string, Partial<CharacterStats>>;

  applyModifiers(stats, classMods[input.primaryClass] ?? {});
  applyModifiers(stats, scaleModifiers(classMods[input.secondaryClass] ?? {}, 0.5));
  applyModifiers(stats, professionMods[input.profession] ?? {});

  const race = getRace(input.raceId);
  const raceBonuses = race?.bonuses ?? {};
  applyModifiers(stats, raceBonuses);

  const keys = Object.keys(stats) as StatKey[];
  const randomKey = keys[Math.floor(input.random() * keys.length)] ?? 'strength';
  stats[randomKey] += Math.floor(input.random() * 3) + 1;

  return { stats, raceBonuses };
}

function applyModifiers(target: CharacterStats, mods: Partial<CharacterStats>): void {
  for (const [key, value] of Object.entries(mods)) {
    if (typeof value === 'number' && key in target) {
      target[key as StatKey] += value;
    }
  }
}

function scaleModifiers(
  mods: Partial<CharacterStats>,
  factor: number,
): Partial<CharacterStats> {
  const scaled: Partial<CharacterStats> = {};
  for (const [key, value] of Object.entries(mods)) {
    if (typeof value === 'number') {
      scaled[key as StatKey] = Math.floor(value * factor);
    }
  }
  return scaled;
}
