import { describe, expect, it, mock } from 'bun:test';
import { MusicDownloadService } from './music-download.service.js';

const service = new MusicDownloadService(
  {
    hostCacheDir: './data/music-cache',
    lavalinkCacheDir: '/music-cache',
    ytdlpPath: 'yt-dlp',
  },
  { debug: mock(), info: mock(), warn: mock(), error: mock() } as never,
);

describe('MusicDownloadService.buildSource', () => {
  it('usa ytsearch1 para texto libre', () => {
    expect(service.buildSource('En Otra Vida')).toBe('ytsearch1:En Otra Vida');
  });

  it('conserva URLs directas', () => {
    expect(service.buildSource('https://soundcloud.com/foo/bar')).toBe(
      'https://soundcloud.com/foo/bar',
    );
  });
});

describe('MusicDownloadService.parseOutput', () => {
  const path = './data/music-cache/Cr8K88UcO0s.mp3';
  const meta = 'Tití Me Preguntó\tBad Bunny\t243\thttps://youtu.be/Cr8K88UcO0s';

  it('extrae los metadatos con la ruta primero', () => {
    const result = service.parseOutput(`${path}\n${meta}\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hostPath).toBe(path);
    expect(result.value.lavalinkPath).toBe('/music-cache/Cr8K88UcO0s.mp3');
    expect(result.value.title).toBe('Tití Me Preguntó');
    expect(result.value.author).toBe('Bad Bunny');
    expect(result.value.length).toBe(243_000);
    expect(result.value.uri).toBe('https://youtu.be/Cr8K88UcO0s');
  });

  it('extrae los mismos metadatos con la ruta al final', () => {
    const result = service.parseOutput(`${meta}\n${path}\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.hostPath).toBe(path);
    expect(result.value.title).toBe('Tití Me Preguntó');
    expect(result.value.author).toBe('Bad Bunny');
  });

  it('usa el nombre del fichero cuando faltan metadatos', () => {
    const result = service.parseOutput(`${path}\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe('Cr8K88UcO0s');
    expect(result.value.author).toBe('Unknown');
    expect(result.value.length).toBe(0);
    expect(result.value.uri).toBeNull();
  });

  it('falla cuando yt-dlp no reporta ruta', () => {
    const result = service.parseOutput(`${meta}\n`);
    expect(result.ok).toBe(false);
  });
});
