export type CatchSpawnGame = 'pokemon' | 'yugioh';

export interface CatchSpawnRecord {
  game: CatchSpawnGame;
  itemId: number;
  itemName: string;
  catchRate: number;
  attemptedBy: Set<string>;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60_000;

export class CatchSpawnRegistry {
  private readonly spawns = new Map<string, CatchSpawnRecord>();

  public constructor(
    private readonly randomId: () => string = () => crypto.randomUUID().slice(0, 8),
    private readonly now: () => number = () => Date.now(),
  ) {}

  public create(input: {
    game: CatchSpawnGame;
    itemId: number;
    itemName: string;
    catchRate: number;
    ttlMs?: number;
  }): string {
    this.cleanup();
    const token = this.randomId();
    this.spawns.set(token, {
      game: input.game,
      itemId: input.itemId,
      itemName: input.itemName,
      catchRate: input.catchRate,
      attemptedBy: new Set(),
      expiresAt: this.now() + (input.ttlMs ?? DEFAULT_TTL_MS),
    });
    return token;
  }

  public get(token: string): CatchSpawnRecord | undefined {
    this.cleanup();
    const spawn = this.spawns.get(token);
    if (!spawn) {
      return undefined;
    }
    if (spawn.expiresAt <= this.now()) {
      this.spawns.delete(token);
      return undefined;
    }
    return spawn;
  }

  public remove(token: string): void {
    this.spawns.delete(token);
  }

  private cleanup(): void {
    const now = this.now();
    for (const [token, spawn] of this.spawns) {
      if (spawn.expiresAt <= now) {
        this.spawns.delete(token);
      }
    }
  }
}

export function catchCustomId(token: string): string {
  return `catch:${token}`;
}

export function parseCatchCustomId(customId: string): string | null {
  const match = /^catch:([a-zA-Z0-9_-]+)$/.exec(customId);
  return match?.[1] ?? null;
}
