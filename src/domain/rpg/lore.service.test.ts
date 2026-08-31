import { describe, expect, it } from 'bun:test';
import { LoreService } from './lore.service.js';

describe('LoreService', () => {
  it('busca entradas de Aethoria', () => {
    const lore = new LoreService();
    const results = lore.search('Lumina');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((entry) => entry.name.includes('Lumina'))).toBe(true);
    expect(lore.overview().world).toBe('Aethoria');
  });
});
