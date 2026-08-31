import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HttpClient } from '../../infrastructure/http/http-client.js';

export interface AnimeAction {
  id: string;
  label: string;
  endpoint: string;
  template: string;
  requiresTarget: boolean;
}

interface AnimeActionsFile {
  baseUrl: string;
  actions: AnimeAction[];
}

interface NekosBestResponse {
  results: {
    url: string;
    anime_name?: string;
  }[];
}

export interface AnimeInteractionResult {
  url: string;
  animeName: string | undefined;
  caption: string;
}

function loadActionsFile(): AnimeActionsFile {
  const path = join(dirname(fileURLToPath(import.meta.url)), '../../content/anime-actions.json');
  return JSON.parse(readFileSync(path, 'utf8')) as AnimeActionsFile;
}

export class AnimeService {
  private readonly config: AnimeActionsFile;

  public constructor(
    private readonly http: HttpClient,
    config?: AnimeActionsFile,
  ) {
    this.config = config ?? loadActionsFile();
  }

  public listActions(): AnimeAction[] {
    return this.config.actions;
  }

  public getAction(id: string): AnimeAction | undefined {
    return this.config.actions.find((action) => action.id === id);
  }

  public async interact(
    actionId: string,
    actorName: string,
    targetName?: string,
  ): Promise<AnimeInteractionResult> {
    const action = this.getAction(actionId);
    if (!action) {
      throw new Error(`Unknown anime action: ${actionId}`);
    }

    if (action.requiresTarget && !targetName) {
      throw new Error(`Action ${actionId} requires a target user`);
    }

    const data = await this.http.getJson<NekosBestResponse>(
      `${this.config.baseUrl}/${action.endpoint}`,
    );
    const result = data.results[0];
    if (!result?.url) {
      throw new Error('nekos.best returned empty results');
    }

    const caption = action.template
      .replaceAll('{actor}', actorName)
      .replaceAll('{target}', targetName ?? 'someone');

    return {
      url: result.url,
      animeName: result.anime_name,
      caption,
    };
  }
}
