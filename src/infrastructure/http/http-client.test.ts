import { describe, expect, it, mock } from 'bun:test';
import { HttpClient, HttpError } from './http-client.js';

describe('HttpClient', () => {
  it('devuelve JSON en éxito', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ) as unknown as typeof fetch;

    try {
      const client = new HttpClient({ retries: 0 });
      const data = await client.getJson<{ ok: boolean }>('https://example.com/api');
      expect(data.ok).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('lanza HttpError en 404 sin reintentar', async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = mock(() => {
      calls += 1;
      return Promise.resolve(new Response('nope', { status: 404 }));
    }) as unknown as typeof fetch;

    try {
      const client = new HttpClient({ retries: 2 });
      let caught: unknown;
      try {
        await client.getJson('https://example.com/missing');
      } catch (error: unknown) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(HttpError);
      expect(calls).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('reintenta en 500 y luego falla', async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = mock(() => {
      calls += 1;
      return Promise.resolve(new Response('err', { status: 500 }));
    }) as unknown as typeof fetch;

    try {
      const client = new HttpClient({ retries: 2, retryDelayMs: 1 });
      let caught: unknown;
      try {
        await client.getJson('https://example.com/fail');
      } catch (error: unknown) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(HttpError);
      expect(calls).toBe(3);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
