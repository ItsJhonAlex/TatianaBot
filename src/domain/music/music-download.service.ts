import { mkdir, unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { Logger } from '../../lib/logger.js';
import { err, ok, type Result } from '../../lib/result.js';

export interface DownloadedMedia {
  hostPath: string;
  lavalinkPath: string;
  title: string;
  author: string;
  length: number;
  uri: string | null;
}

export type DownloadError =
  | { code: 'YTDLP_MISSING' }
  | { code: 'DOWNLOAD_FAILED'; message: string };

export interface MusicDownloadConfig {
  hostCacheDir: string;
  lavalinkCacheDir: string;
  ytdlpPath: string;
  cookiesFromBrowser?: string | undefined;
}

export class MusicDownloadService {
  /** Tab keeps the metadata line distinguishable from the filepath line, whatever order yt-dlp emits them in. */
  private static readonly FIELD_SEP = '\t';

  public constructor(
    private readonly config: MusicDownloadConfig,
    private readonly logger: Logger,
  ) {}

  public async ensureReady(): Promise<boolean> {
    try {
      // The binary may be a bare name resolved via PATH, so probe it by running it.
      const proc = Bun.spawn([this.config.ytdlpPath, '--version'], {
        stdout: 'pipe',
        stderr: 'pipe',
      });
      const exitCode = await proc.exited;
      if (exitCode !== 0) {
        return false;
      }
      await mkdir(this.config.hostCacheDir, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  public buildSource(query: string): string {
    const trimmed = query.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    if (/^ytsearch:/i.test(trimmed)) {
      return trimmed.replace(/^ytsearch:/i, 'ytsearch1:');
    }
    if (/^ytmsearch:/i.test(trimmed)) {
      return trimmed.replace(/^ytmsearch:/i, 'ytsearch1:');
    }
    if (/^scsearch:/i.test(trimmed)) {
      return trimmed.replace(/^scsearch:/i, 'scsearch1:');
    }
    return `ytsearch1:${trimmed}`;
  }

  public async download(query: string): Promise<Result<DownloadedMedia, DownloadError>> {
    const source = this.buildSource(query);
    const outputTemplate = join(this.config.hostCacheDir, '%(id)s.%(ext)s');

    const args = [
      this.config.ytdlpPath,
      '-x',
      '--audio-format',
      'mp3',
      '--audio-quality',
      '0',
      '-o',
      outputTemplate,
      '--no-playlist',
      '--no-overwrites',
      '--print',
      'after_move:filepath',
      '--print',
      `%(title)s${MusicDownloadService.FIELD_SEP}%(uploader)s${MusicDownloadService.FIELD_SEP}%(duration)s${MusicDownloadService.FIELD_SEP}%(webpage_url)s`,
    ];

    if (this.config.cookiesFromBrowser) {
      args.splice(1, 0, '--cookies-from-browser', this.config.cookiesFromBrowser);
    }

    args.push(source);

    const proc = Bun.spawn(args, { stdout: 'pipe', stderr: 'pipe' });

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    if (exitCode !== 0) {
      this.logger.warn({ exitCode, stderr: stderr.slice(0, 800), source }, 'yt-dlp download failed');
      return err({ code: 'DOWNLOAD_FAILED', message: this.describeFailure(stderr) });
    }

    return this.parseOutput(stdout);
  }

  /** yt-dlp emits the `after_move` and video-stage prints in an unspecified order, so match by shape. */
  public parseOutput(stdout: string): Result<DownloadedMedia, DownloadError> {
    const lines = stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const metaLine = lines.find((line) => line.includes(MusicDownloadService.FIELD_SEP));
    const hostPath = lines.find((line) => !line.includes(MusicDownloadService.FIELD_SEP));

    if (!hostPath) {
      return err({ code: 'DOWNLOAD_FAILED', message: 'yt-dlp did not report the downloaded file' });
    }

    const [title, author, duration, webpageUrl] = (metaLine ?? '').split(
      MusicDownloadService.FIELD_SEP,
    );
    const durationSec = Number.parseFloat(duration ?? '');

    return ok({
      hostPath,
      lavalinkPath: join(this.config.lavalinkCacheDir, basename(hostPath)),
      title: title && title !== 'NA' ? title : basename(hostPath, '.mp3'),
      author: author && author !== 'NA' ? author : 'Unknown',
      length: Number.isFinite(durationSec) ? Math.round(durationSec * 1000) : 0,
      uri: webpageUrl?.startsWith('http') ? webpageUrl : null,
    });
  }

  private describeFailure(stderr: string): string {
    const cookiesConfigured = Boolean(this.config.cookiesFromBrowser);

    if (/could not (find|copy|read).*cookies|cookies database|Permission denied/i.test(stderr)) {
      return `Could not read cookies from ${this.config.cookiesFromBrowser ?? 'browser'}. Close the browser or check the profile is unlocked.`;
    }

    if (stderr.includes('Sign in to confirm')) {
      return cookiesConfigured
        ? `YouTube rejected the request even with ${this.config.cookiesFromBrowser ?? 'browser'} cookies. Log in to YouTube in that browser, or try another track.`
        : 'YouTube blocked the download — set YTDLP_COOKIES_FROM_BROWSER=firefox (or chrome) in .env';
    }

    if (stderr.includes('DRM protected')) {
      return 'That track is DRM protected and cannot be downloaded. Try another source.';
    }

    return stderr.trim().split('\n').at(-1) ?? 'yt-dlp failed';
  }

  public async delete(hostPath: string): Promise<void> {
    try {
      await unlink(hostPath);
      this.logger.debug({ hostPath }, 'Deleted cached music file');
    } catch (error: unknown) {
      this.logger.warn({ err: error, hostPath }, 'Failed to delete cached music file');
    }
  }
}
