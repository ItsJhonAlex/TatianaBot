export class HttpError extends Error {
  public constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`HTTP ${String(status)} for ${url}`);
    this.name = 'HttpError';
  }
}

export interface HttpClientOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class HttpClient {
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryDelayMs: number;

  public constructor(options: HttpClientOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.retries = options.retries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 250;
  }

  public async getJson<T>(url: string): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this.fetchJsonOnce<T>(url);
      } catch (error: unknown) {
        lastError = error;
        const retryable =
          !(error instanceof HttpError) || error.status >= 500 || error.status === 429;

        if (!retryable || attempt === this.retries) {
          throw error;
        }

        await sleep(this.retryDelayMs * (attempt + 1));
      }
    }

    throw lastError;
  }

  private async fetchJsonOnce<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new HttpError(response.status, url);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
