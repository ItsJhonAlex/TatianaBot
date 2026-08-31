import type { UserRepository } from '../../infrastructure/db/repositories/user.repository.js';
import { err, ok, type Result } from '../../lib/result.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_MIN = 10;
const DAILY_MAX = 100;

export type DailyError =
  | { code: 'COOLDOWN'; remainingMs: number }
  | { code: 'INTERNAL'; message: string };

export type TransferError =
  | { code: 'SELF_TRANSFER' }
  | { code: 'INVALID_AMOUNT' }
  | { code: 'INSUFFICIENT_FUNDS'; balance: number }
  | { code: 'INTERNAL'; message: string };

export interface DailyReward {
  amount: number;
  balance: number;
}

export interface TransferResult {
  amount: number;
  fromBalance: number;
  toBalance: number;
}

export class EconomyService {
  public constructor(
    private readonly users: UserRepository,
    private readonly random: () => number = Math.random,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public getBalance(discordId: string): number {
    return this.users.getOrCreate(discordId).balance;
  }

  public claimDaily(discordId: string): Result<DailyReward, DailyError> {
    const user = this.users.getOrCreate(discordId);
    const now = this.now();

    if (user.lastDailyAt) {
      const elapsed = now.getTime() - user.lastDailyAt.getTime();
      if (elapsed < DAY_MS) {
        return err({ code: 'COOLDOWN', remainingMs: DAY_MS - elapsed });
      }
    }

    const amount = Math.floor(this.random() * (DAILY_MAX - DAILY_MIN + 1)) + DAILY_MIN;
    const updated = this.users.updateBalance(discordId, user.balance + amount, now);

    return ok({ amount, balance: updated.balance });
  }

  public transfer(
    fromId: string,
    toId: string,
    amount: number,
  ): Result<TransferResult, TransferError> {
    if (fromId === toId) {
      return err({ code: 'SELF_TRANSFER' });
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return err({ code: 'INVALID_AMOUNT' });
    }

    const from = this.users.getOrCreate(fromId);
    this.users.getOrCreate(toId);

    if (from.balance < amount) {
      return err({ code: 'INSUFFICIENT_FUNDS', balance: from.balance });
    }

    const fromUpdated = this.users.updateBalance(fromId, from.balance - amount);
    const toUser = this.users.findByDiscordId(toId);
    if (!toUser) {
      return err({ code: 'INTERNAL', message: 'Destinatario no encontrado' });
    }

    const toUpdated = this.users.updateBalance(toId, toUser.balance + amount);

    return ok({
      amount,
      fromBalance: fromUpdated.balance,
      toBalance: toUpdated.balance,
    });
  }
}

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString()}h ${minutes.toString()}m ${seconds.toString()}s`;
}
