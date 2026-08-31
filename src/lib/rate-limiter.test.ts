import { describe, expect, it } from 'bun:test';
import { RateLimiter } from './rate-limiter.js';

describe('RateLimiter', () => {
  it('permite el primer uso y bloquea dentro del cooldown', () => {
    let now = 1_000;
    const limiter = new RateLimiter(() => now);

    expect(limiter.tryConsume('u1:meme', 5_000).ok).toBe(true);

    now = 3_000;
    const blocked = limiter.tryConsume('u1:meme', 5_000);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.remainingMs).toBe(3_000);
    }

    now = 6_000;
    expect(limiter.tryConsume('u1:meme', 5_000).ok).toBe(true);
  });

  it('aísla claves distintas', () => {
    const limiter = new RateLimiter(() => 1_000);
    expect(limiter.tryConsume('u1:meme', 5_000).ok).toBe(true);
    expect(limiter.tryConsume('u2:meme', 5_000).ok).toBe(true);
  });
});
