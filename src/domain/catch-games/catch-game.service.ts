import type { CatchAttemptRepository, CatchGameType } from '../../infrastructure/db/repositories/catch-attempt.repository.js';
import { err, ok, type Result } from '../../lib/result.js';

export const CATCH_MAX_ATTEMPTS = 10;
export const CATCH_RESET_MS = 60 * 60 * 1000;
export const CATCH_REWARD_COINS = 10;

export interface AttemptError {
  code: 'NO_ATTEMPTS';
  remainingMs: number;
}

export interface AttemptState {
  remaining: number;
  lastResetAt: Date;
}

export class CatchGameService {
  public constructor(
    private readonly attempts: CatchAttemptRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public getState(discordId: string, gameType: CatchGameType): AttemptState {
    return this.refresh(discordId, gameType);
  }

  public consumeAttempt(
    discordId: string,
    gameType: CatchGameType,
  ): Result<AttemptState, AttemptError> {
    const state = this.refresh(discordId, gameType);
    if (state.remaining <= 0) {
      const remainingMs = Math.max(
        0,
        CATCH_RESET_MS - (this.now().getTime() - state.lastResetAt.getTime()),
      );
      return err({ code: 'NO_ATTEMPTS', remainingMs });
    }

    const updated = this.attempts.upsert({
      discordId,
      gameType,
      attemptsRemaining: state.remaining - 1,
      lastResetAt: state.lastResetAt,
    });

    return ok({
      remaining: updated.attemptsRemaining,
      lastResetAt: updated.lastResetAt,
    });
  }

  private refresh(discordId: string, gameType: CatchGameType): AttemptState {
    const existing = this.attempts.find(discordId, gameType);
    const now = this.now();

    if (!existing) {
      const created = this.attempts.upsert({
        discordId,
        gameType,
        attemptsRemaining: CATCH_MAX_ATTEMPTS,
        lastResetAt: now,
      });
      return { remaining: created.attemptsRemaining, lastResetAt: created.lastResetAt };
    }

    const elapsed = now.getTime() - existing.lastResetAt.getTime();
    if (elapsed >= CATCH_RESET_MS) {
      const reset = this.attempts.upsert({
        discordId,
        gameType,
        attemptsRemaining: CATCH_MAX_ATTEMPTS,
        lastResetAt: now,
      });
      return { remaining: reset.attemptsRemaining, lastResetAt: reset.lastResetAt };
    }

    return { remaining: existing.attemptsRemaining, lastResetAt: existing.lastResetAt };
  }
}

export function formatCatchReset(ms: number): string {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  return `${String(totalMinutes)}m`;
}

export function countByName(names: string[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
