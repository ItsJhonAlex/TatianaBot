const ONE_MINUTE_MS = 60_000;

export interface MetricsSnapshot {
  startedAt: number;
  uptimeMs: number;
  totalCommands: number;
  commandsLastMinute: number;
  commandsPerMinute: number;
}

export function formatUptime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${String(days)}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${String(hours)}h`);
  }
  if (minutes > 0 || hours > 0 || days > 0) {
    parts.push(`${String(minutes)}m`);
  }
  parts.push(`${String(seconds)}s`);
  return parts.join(' ');
}

/** In-memory process metrics: uptime and a sliding 60s command window. */
export class MetricsService {
  private readonly startedAt: number;
  private readonly commandTimestamps: number[] = [];
  private totalCommands = 0;

  public constructor(private readonly now: () => number = Date.now) {
    this.startedAt = this.now();
  }

  public recordCommand(): void {
    const ts = this.now();
    this.totalCommands += 1;
    this.commandTimestamps.push(ts);
    this.prune(ts);
  }

  public snapshot(): MetricsSnapshot {
    const now = this.now();
    this.prune(now);
    const commandsLastMinute = this.commandTimestamps.length;
    const uptimeMs = Math.max(0, now - this.startedAt);
    const uptimeMinutes = uptimeMs / ONE_MINUTE_MS;
    const commandsPerMinute =
      uptimeMinutes < 1 ? commandsLastMinute : this.totalCommands / Math.max(uptimeMinutes, 1 / 60);

    return {
      startedAt: this.startedAt,
      uptimeMs,
      totalCommands: this.totalCommands,
      commandsLastMinute,
      commandsPerMinute: Math.round(commandsPerMinute * 10) / 10,
    };
  }

  private prune(now: number): void {
    const cutoff = now - ONE_MINUTE_MS;
    while (this.commandTimestamps.length > 0) {
      const oldest = this.commandTimestamps[0];
      if (oldest === undefined || oldest >= cutoff) {
        break;
      }
      this.commandTimestamps.shift();
    }
  }
}
