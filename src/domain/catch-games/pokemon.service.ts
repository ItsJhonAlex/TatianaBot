import type { HttpClient } from '../../infrastructure/http/http-client.js';
import type { PokemonRepository } from '../../infrastructure/db/repositories/pokemon.repository.js';
import type { UserRepository } from '../../infrastructure/db/repositories/user.repository.js';
import { CATCH_REWARD_COINS, countByName } from './catch-game.service.js';

export type PokemonRarity = 'common' | 'rare' | 'very_rare';

export interface PokemonSpawn {
  pokemonId: number;
  name: string;
  imageUrl: string | null;
  types: string[];
  weightKg: number;
  stats: { label: string; value: number; short: string }[];
  rarity: PokemonRarity;
  catchRate: number;
}

export interface InventoryEntry {
  name: string;
  count: number;
}

interface PokeApiStat {
  base_stat: number;
  stat: { name: string };
}

interface PokeApiResponse {
  id: number;
  name: string;
  weight: number;
  sprites?: { front_default?: string | null };
  types?: { type: { name: string } }[];
  stats?: PokeApiStat[];
}

const STAT_LABELS: Record<string, { label: string; short: string }> = {
  hp: { label: 'HP', short: 'HP' },
  attack: { label: 'Attack', short: 'ATK' },
  defense: { label: 'Defense', short: 'DEF' },
  'special-attack': { label: 'Sp. Atk', short: 'SP.ATK' },
  'special-defense': { label: 'Sp. Def', short: 'SP.DEF' },
  speed: { label: 'Speed', short: 'SPD' },
};

const RARITY_TABLE: Record<PokemonRarity, { catchRate: number; label: string; color: number }> = {
  common: { catchRate: 0.8, label: 'Common', color: 0x95a5a6 },
  rare: { catchRate: 0.5, label: 'Rare', color: 0x3498db },
  very_rare: { catchRate: 0.2, label: 'Very Rare', color: 0x9b59b6 },
};

const GEN1_MAX = 151;

export class PokemonService {
  public constructor(
    private readonly http: HttpClient,
    private readonly pokemon: PokemonRepository,
    private readonly users: UserRepository,
    private readonly random: () => number = Math.random,
  ) {}

  public async spawnRandom(): Promise<PokemonSpawn> {
    const pokemonId = Math.floor(this.random() * GEN1_MAX) + 1;
    const data = await this.http.getJson<PokeApiResponse>(
      `https://pokeapi.co/api/v2/pokemon/${String(pokemonId)}`,
    );

    const rarity = this.rollRarity();
    const rarityMeta = RARITY_TABLE[rarity];

    return {
      pokemonId: data.id,
      name: capitalize(data.name),
      imageUrl: data.sprites?.front_default ?? null,
      types: (data.types ?? []).map((entry) => capitalize(entry.type.name)),
      weightKg: data.weight / 10,
      stats: (data.stats ?? []).map((stat) => {
        const labels = STAT_LABELS[stat.stat.name] ?? {
          label: capitalize(stat.stat.name),
          short: stat.stat.name.toUpperCase(),
        };
        return { label: labels.label, value: stat.base_stat, short: labels.short };
      }),
      rarity,
      catchRate: rarityMeta.catchRate,
    };
  }

  public tryCatch(discordId: string, spawn: Pick<PokemonSpawn, 'pokemonId' | 'name' | 'catchRate'>): boolean {
    if (this.random() > spawn.catchRate) {
      return false;
    }

    this.pokemon.add(discordId, spawn.pokemonId, spawn.name);
    const user = this.users.getOrCreate(discordId);
    this.users.updateBalance(discordId, user.balance + CATCH_REWARD_COINS);
    return true;
  }

  public getInventory(discordId: string): { total: number; entries: InventoryEntry[] } {
    const rows = this.pokemon.listByUser(discordId);
    return {
      total: rows.length,
      entries: countByName(rows.map((row) => row.pokemonName)),
    };
  }

  public rarityMeta(rarity: PokemonRarity) {
    return RARITY_TABLE[rarity];
  }

  private rollRarity(): PokemonRarity {
    const roll = this.random();
    if (roll < 0.15) {
      return 'very_rare';
    }
    if (roll < 0.45) {
      return 'rare';
    }
    return 'common';
  }
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
