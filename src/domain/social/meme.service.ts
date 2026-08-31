import type { HttpClient } from '../../infrastructure/http/http-client.js';

export interface MemeResult {
  url: string;
  title: string;
  subreddit: string;
  author: string;
  postLink: string;
}

interface MemeApiResponse {
  url: string;
  title: string;
  subreddit?: string;
  author?: string;
  postLink?: string;
}

const SUBREDDITS_ES = [
  'SpanishMeme',
  'MemesEnEspanol',
  'memesenespanol',
  'spanishmemes',
  'MemesESP',
] as const;

const SUBREDDITS_EN = ['memes', 'dankmemes', 'me_irl', 'wholesomememes'] as const;

export class MemeService {
  public constructor(
    private readonly http: HttpClient,
    private readonly random: () => number = Math.random,
  ) {}

  public async fetchRandom(): Promise<MemeResult> {
    const fromEs = await this.trySubreddits(SUBREDDITS_ES);
    if (fromEs) {
      return fromEs;
    }

    const fromEn = await this.trySubreddits(SUBREDDITS_EN);
    if (fromEn) {
      return fromEn;
    }

    throw new Error('No meme available from meme-api');
  }

  private async trySubreddits(list: readonly string[]): Promise<MemeResult | null> {
    const subreddit = list[Math.floor(this.random() * list.length)];
    if (!subreddit) {
      return null;
    }

    try {
      const data = await this.http.getJson<MemeApiResponse>(
        `https://meme-api.com/gimme/${subreddit}`,
      );

      if (!data.url || !data.title) {
        return null;
      }

      return {
        url: data.url,
        title: data.title,
        subreddit: data.subreddit ?? subreddit,
        author: data.author ?? 'unknown',
        postLink: data.postLink ?? data.url,
      };
    } catch {
      return null;
    }
  }
}
