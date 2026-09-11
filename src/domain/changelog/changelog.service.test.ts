import { describe, expect, it } from 'bun:test';
import { formatChangelogBody, parseChangelog } from './changelog.service.js';

const SAMPLE = `# Changelog

## [2.5.0] — 2026-08-31

### Añadido

- Música

## [2.4.0] — 2026-08-30

### Añadido

- Moderación

## [1.9.0] — 2025-01-01

- Legacy
`;

describe('parseChangelog', () => {
  it('extrae versiones Keep a Changelog en orden', () => {
    const entries = parseChangelog(SAMPLE);
    expect(entries).toHaveLength(3);
    expect(entries[0]?.version).toBe('2.5.0');
    expect(entries[0]?.date).toBe('2026-08-31');
    expect(entries[0]?.body).toContain('Música');
    expect(entries[1]?.version).toBe('2.4.0');
  });

  it('acepta guiones ASCII en el header', () => {
    const entries = parseChangelog('## [3.0.0] - 2026-09-11\n\n- Foo\n');
    expect(entries[0]?.version).toBe('3.0.0');
    expect(entries[0]?.date).toBe('2026-09-11');
  });
});

describe('formatChangelogBody', () => {
  it('trunca cuerpos largos', () => {
    const body = 'x'.repeat(1200);
    const formatted = formatChangelogBody(body, 100);
    expect(formatted.length).toBe(100);
    expect(formatted.endsWith('…')).toBe(true);
  });
});
