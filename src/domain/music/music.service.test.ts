import { describe, expect, it } from 'bun:test';
import { formatSuggestionLabel, formatTrackDuration } from './music.service.js';

describe('formatTrackDuration', () => {
  it('formatea milisegundos a m:ss', () => {
    expect(formatTrackDuration(0)).toBe('0:00');
    expect(formatTrackDuration(65_000)).toBe('1:05');
    expect(formatTrackDuration(3_661_000)).toBe('61:01');
  });
});

describe('formatSuggestionLabel', () => {
  it('trunca etiquetas largas a 100 caracteres', () => {
    const label = formatSuggestionLabel('A'.repeat(80), 'B'.repeat(80), 180_000);
    expect(label.length).toBeLessThanOrEqual(100);
    expect(label.endsWith('...')).toBe(true);
  });
});
