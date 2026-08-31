import type { HttpClient } from '../../infrastructure/http/http-client.js';
import type { UserRepository } from '../../infrastructure/db/repositories/user.repository.js';
import type { YugiohRepository } from '../../infrastructure/db/repositories/yugioh.repository.js';
import { CATCH_REWARD_COINS, countByName } from './catch-game.service.js';
import type { InventoryEntry } from './pokemon.service.js';

export interface YugiohSpawn {
  cardId: number;
  name: string;
  imageUrl: string | null;
  type: string;
  race: string;
  archetype: string | null;
  description: string;
  atk: number | null;
  def: number | null;
  level: number | null;
  price: number;
  rarityLabel: string;
  color: number;
  catchRate: number;
}

interface YugiohCardPayload {
  id?: number;
  name?: string;
  type?: string;
  race?: string;
  archetype?: string;
  desc?: string;
  atk?: number;
  def?: number;
  level?: number;
  card_images?: { image_url?: string }[];
  card_prices?: { cardmarket_price?: string }[];
}

interface YugiohWrappedResponse {
  data?: YugiohCardPayload[];
}

export class YugiohService {
  public constructor(
    private readonly http: HttpClient,
    private readonly cards: YugiohRepository,
    private readonly users: UserRepository,
    private readonly random: () => number = Math.random,
  ) {}

  public async spawnRandom(): Promise<YugiohSpawn> {
    const payload = await this.http.getJson<YugiohCardPayload | YugiohWrappedResponse>(
      'https://db.ygoprodeck.com/api/v7/randomcard.php',
    );
    const card = unwrapCard(payload);
    if (!card?.id || !card.name) {
      throw new Error('YGOProDeck returned an empty card');
    }

    const price = Number.parseFloat(card.card_prices?.[0]?.cardmarket_price ?? '0') || 0;
    const catchRate = Math.max(0.1, Math.min(0.9, 1 - price / 100));
    const rarity = rarityFromPrice(price);

    return {
      cardId: card.id,
      name: card.name,
      imageUrl: card.card_images?.[0]?.image_url ?? null,
      type: card.type ?? 'Unknown',
      race: card.race ?? 'Unknown',
      archetype: card.archetype ?? null,
      description: (card.desc ?? 'No description available').slice(0, 1500),
      atk: card.atk ?? null,
      def: card.def ?? null,
      level: card.level ?? null,
      price,
      rarityLabel: rarity.label,
      color: rarity.color,
      catchRate,
    };
  }

  public tryCatch(
    discordId: string,
    spawn: Pick<YugiohSpawn, 'cardId' | 'name' | 'catchRate'>,
  ): boolean {
    if (this.random() > spawn.catchRate) {
      return false;
    }

    this.cards.add(discordId, spawn.cardId, spawn.name);
    const user = this.users.getOrCreate(discordId);
    this.users.updateBalance(discordId, user.balance + CATCH_REWARD_COINS);
    return true;
  }

  public getInventory(discordId: string): { total: number; entries: InventoryEntry[] } {
    const rows = this.cards.listByUser(discordId);
    return {
      total: rows.length,
      entries: countByName(rows.map((row) => row.cardName)),
    };
  }
}

function unwrapCard(payload: YugiohCardPayload | YugiohWrappedResponse): YugiohCardPayload | null {
  if ('data' in payload && Array.isArray(payload.data)) {
    return payload.data[0] ?? null;
  }
  return payload as YugiohCardPayload;
}

function rarityFromPrice(price: number): { label: string; color: number } {
  if (price < 1) {
    return { label: 'Common', color: 0xcccccc };
  }
  if (price < 5) {
    return { label: 'Rare', color: 0x3498db };
  }
  if (price < 20) {
    return { label: 'Super Rare', color: 0x9b59b6 };
  }
  return { label: 'Ultra Rare', color: 0xf1c40f };
}
