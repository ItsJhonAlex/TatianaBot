import { describe, expect, it } from 'bun:test';
import { AnimeService } from './anime.service.js';
import type { HttpClient } from '../../infrastructure/http/http-client.js';

describe('AnimeService', () => {
  it('lista acciones desde config y construye caption', async () => {
    const http = {
      getJson: () =>
        Promise.resolve({
          results: [{ url: 'https://example.com/hug.gif', anime_name: 'Test Anime' }],
        }),
    } as unknown as HttpClient;

    const service = new AnimeService(http, {
      baseUrl: 'https://nekos.best/api/v2',
      actions: [
        {
          id: 'hug',
          label: 'Hug',
          endpoint: 'hug',
          template: '{actor} hugs {target}!',
          requiresTarget: true,
        },
      ],
    });

    expect(service.listActions()).toHaveLength(1);
    const result = await service.interact('hug', 'Alex', 'Sam');
    expect(result.caption).toBe('Alex hugs Sam!');
    expect(result.url).toBe('https://example.com/hug.gif');
    expect(result.animeName).toBe('Test Anime');
  });
});
