import { describe, expect, it } from 'bun:test';
import {
  CatchSpawnRegistry,
  catchCustomId,
  parseCatchCustomId,
} from './catch-spawn.registry.js';

describe('CatchSpawnRegistry', () => {
  it('crea, resuelve y expira spawns', () => {
    let now = 1_000;
    const registry = new CatchSpawnRegistry(() => 'abc123', () => now);

    const token = registry.create({
      game: 'pokemon',
      itemId: 1,
      itemName: 'Bulbasaur',
      catchRate: 0.8,
      ttlMs: 100,
    });

    expect(token).toBe('abc123');
    expect(parseCatchCustomId(catchCustomId(token))).toBe('abc123');
    expect(registry.get(token)?.itemName).toBe('Bulbasaur');

    now = 1_200;
    expect(registry.get(token)).toBeUndefined();
  });
});
