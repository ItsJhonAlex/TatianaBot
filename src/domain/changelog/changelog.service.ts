import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { err, ok, type Result } from '../../lib/result.js';

export interface ChangelogEntry {
  version: string;
  date: string | null;
  body: string;
}

export type ChangelogError =
  | { code: 'NOT_FOUND' }
  | { code: 'EMPTY' }
  | { code: 'READ_FAILED'; message: string };

const DEFAULT_CHANGELOG_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../CHANGELOG.md',
);

const VERSION_HEADER = /^## \[([^\]]+)\](?:\s*[—–-]\s*(.+))?$/;

/** Parses Keep a Changelog markdown into versioned entries. */
export function parseChangelog(markdown: string): ChangelogEntry[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const entries: ChangelogEntry[] = [];
  let current: ChangelogEntry | null = null;
  const bodyLines: string[] = [];

  const flush = () => {
    if (!current) {
      return;
    }
    current.body = bodyLines.join('\n').trim();
    entries.push(current);
    bodyLines.length = 0;
    current = null;
  };

  for (const line of lines) {
    const match = VERSION_HEADER.exec(line.trim());
    if (match) {
      flush();
      const version = match[1];
      if (!version) {
        continue;
      }
      current = {
        version,
        date: match[2]?.trim() ?? null,
        body: '',
      };
      continue;
    }

    if (current) {
      bodyLines.push(line);
    }
  }

  flush();
  return entries;
}

export class ChangelogService {
  public constructor(private readonly changelogPath = DEFAULT_CHANGELOG_PATH) {}

  public async listEntries(): Promise<Result<ChangelogEntry[], ChangelogError>> {
    try {
      const markdown = await readFile(this.changelogPath, 'utf8');
      const entries = parseChangelog(markdown).filter((entry) => !entry.version.startsWith('1.'));
      if (entries.length === 0) {
        return err({ code: 'EMPTY' });
      }
      return ok(entries);
    } catch (error: unknown) {
      return err({
        code: 'READ_FAILED',
        message: error instanceof Error ? error.message : 'Could not read CHANGELOG.md',
      });
    }
  }

  public async getLatest(limit = 1): Promise<Result<ChangelogEntry[], ChangelogError>> {
    const listed = await this.listEntries();
    if (!listed.ok) {
      return listed;
    }
    return ok(listed.value.slice(0, Math.max(1, limit)));
  }

  public async getVersion(version: string): Promise<Result<ChangelogEntry, ChangelogError>> {
    const normalized = version.trim().replace(/^v/i, '');
    const listed = await this.listEntries();
    if (!listed.ok) {
      return listed;
    }
    const hit = listed.value.find((entry) => entry.version === normalized);
    if (!hit) {
      return err({ code: 'NOT_FOUND' });
    }
    return ok(hit);
  }
}

/** Discord embed field values max out at 1024 characters. */
export function formatChangelogBody(body: string, maxLength = 1000): string {
  const trimmed = body.trim() || '_Sin notas._';
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
