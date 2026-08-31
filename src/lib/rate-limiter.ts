export type RateLimitResult = { ok: true } | { ok: false; remainingMs: number };

/**
 * Rate limiter en memoria por clave (p. ej. userId:command).
 */
export class RateLimiter {
  private readonly hits = new Map<string, number>();

  public constructor(private readonly now: () => number = () => Date.now()) {}

  public tryConsume(key: string, cooldownMs: number): RateLimitResult {
    const current = this.now();
    const last = this.hits.get(key);

    if (last !== undefined) {
      const remainingMs = cooldownMs - (current - last);
      if (remainingMs > 0) {
        return { ok: false, remainingMs };
      }
    }

    this.hits.set(key, current);
    return { ok: true };
  }
}
