import { describe, expect, it } from 'bun:test';
import { formatUptime, MetricsService } from './metrics.service.js';

describe('formatUptime', () => {
  it('formatea milisegundos a d/h/m/s', () => {
    expect(formatUptime(0)).toBe('0s');
    expect(formatUptime(65_000)).toBe('1m 5s');
    expect(formatUptime(3_726_000)).toBe('1h 2m 6s');
  });
});

describe('MetricsService', () => {
  it('cuenta comandos en la ventana de un minuto', () => {
    let now = 1_000_000;
    const metrics = new MetricsService(() => now);

    metrics.recordCommand();
    metrics.recordCommand();
    now += 30_000;
    metrics.recordCommand();

    const snap = metrics.snapshot();
    expect(snap.totalCommands).toBe(3);
    expect(snap.commandsLastMinute).toBe(3);

    now += 40_000;
    const later = metrics.snapshot();
    expect(later.commandsLastMinute).toBe(1);
    expect(later.totalCommands).toBe(3);
  });

  it('reporta uptime desde el arranque', () => {
    let now = 0;
    const metrics = new MetricsService(() => now);
    now = 90_000;
    expect(metrics.snapshot().uptimeMs).toBe(90_000);
    expect(formatUptime(metrics.snapshot().uptimeMs)).toBe('1m 30s');
  });
});
