import type { EmbedPayload, EmbedRepository } from '../../infrastructure/db/repositories/embed.repository.js';
import { err, ok, type Result } from '../../lib/result.js';

export type EmbedError =
  | { code: 'NOT_FOUND' }
  | { code: 'INVALID_COLOR' }
  | { code: 'INVALID_NAME' };

export class EmbedService {
  public constructor(private readonly embeds: EmbedRepository) {}

  public create(
    guildId: string,
    name: string,
    payload: EmbedPayload,
    createdBy: string,
  ): Result<EmbedPayload, EmbedError> {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 64) {
      return err({ code: 'INVALID_NAME' });
    }
    if (payload.color !== undefined && !Number.isInteger(payload.color)) {
      return err({ code: 'INVALID_COLOR' });
    }

    this.embeds.upsert(guildId, trimmed, payload, createdBy);
    return ok(payload);
  }

  public update(
    guildId: string,
    name: string,
    patch: EmbedPayload,
    updatedBy: string,
  ): Result<EmbedPayload, EmbedError> {
    const existing = this.embeds.find(guildId, name);
    if (!existing) {
      return err({ code: 'NOT_FOUND' });
    }

    const current = JSON.parse(existing.payloadJson) as EmbedPayload;
    const merged: EmbedPayload = {
      ...current,
      ...Object.fromEntries(
        Object.entries(patch).filter(([, value]) => value !== undefined),
      ),
    };
    if (patch.fields) {
      merged.fields = [...(current.fields ?? []), ...patch.fields];
    }

    this.embeds.upsert(guildId, name, merged, updatedBy);
    return ok(merged);
  }

  public get(guildId: string, name: string): Result<EmbedPayload, EmbedError> {
    const row = this.embeds.find(guildId, name);
    if (!row) {
      return err({ code: 'NOT_FOUND' });
    }
    return ok(JSON.parse(row.payloadJson) as EmbedPayload);
  }

  public list(guildId: string): string[] {
    return this.embeds.list(guildId).map((row) => row.name);
  }

  public delete(guildId: string, name: string): Result<true, EmbedError> {
    return this.embeds.delete(guildId, name) ? ok(true) : err({ code: 'NOT_FOUND' });
  }
}

export function parseHexColor(input: string): number | null {
  const cleaned = input.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return null;
  }
  return Number.parseInt(cleaned, 16);
}
