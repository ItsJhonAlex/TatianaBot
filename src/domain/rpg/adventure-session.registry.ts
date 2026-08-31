export interface AdventureDraft {
  discordId: string;
  name?: string;
  surname?: string;
  raceId?: string;
  gender?: string;
  primaryClass?: string;
  secondaryClass?: string;
  primordialClass?: string;
  profession?: string;
  expiresAt: number;
}

const TTL_MS = 10 * 60 * 1000;

export class AdventureSessionRegistry {
  private readonly sessions = new Map<string, AdventureDraft>();

  public constructor(
    private readonly randomId: () => string = () => crypto.randomUUID().slice(0, 8),
    private readonly now: () => number = () => Date.now(),
  ) {}

  public start(discordId: string): string {
    this.cleanup();
    const token = this.randomId();
    this.sessions.set(token, {
      discordId,
      expiresAt: this.now() + TTL_MS,
    });
    return token;
  }

  public get(token: string): AdventureDraft | undefined {
    this.cleanup();
    const session = this.sessions.get(token);
    if (!session || session.expiresAt <= this.now()) {
      this.sessions.delete(token);
      return undefined;
    }
    return session;
  }

  public patch(token: string, patch: Partial<AdventureDraft>): AdventureDraft | undefined {
    const session = this.get(token);
    if (!session) {
      return undefined;
    }
    Object.assign(session, patch);
    return session;
  }

  public remove(token: string): void {
    this.sessions.delete(token);
  }

  private cleanup(): void {
    const now = this.now();
    for (const [token, session] of this.sessions) {
      if (session.expiresAt <= now) {
        this.sessions.delete(token);
      }
    }
  }
}

export function adventureCustomId(step: string, token: string): string {
  return `adv:${step}:${token}`;
}

export function parseAdventureCustomId(
  customId: string,
): { step: string; token: string } | null {
  const match = /^adv:([a-z]+):([a-zA-Z0-9_-]+)$/.exec(customId);
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return { step: match[1], token: match[2] };
}
