import {
  Connectors,
  LoadType,
  Shoukaku,
  type NodeOption,
  type Player,
  type Track,
  type TrackEndEvent,
} from 'shoukaku';
import type { SapphireClient } from '@sapphire/framework';
import type { Logger } from '../../lib/logger.js';
import { err, ok, type Result } from '../../lib/result.js';
import type { MusicDownloadService } from './music-download.service.js';

export interface QueueTrack {
  encoded: string;
  title: string;
  author: string;
  uri: string | null;
  length: number;
  requesterId: string;
  /** Archivo temporal en el host cuando se usa modo descarga (yt-dlp). */
  localHostPath?: string;
}

export interface MusicSearchSuggestion {
  name: string;
  value: string;
}

interface CachedPlaySelection {
  encoded: string;
  title: string;
  author: string;
  uri: string | null;
  length: number;
  expiresAt: number;
}

export interface NowPlaying {
  track: QueueTrack;
  paused: boolean;
}

export type MusicError =
  | { code: 'NO_NODE' }
  | { code: 'NOT_CONNECTED' }
  | { code: 'EMPTY_QUEUE' }
  | { code: 'NOTHING_PLAYING' }
  | { code: 'NO_RESULTS' }
  | { code: 'RESOLVE_FAILED'; message: string };

interface GuildQueueState {
  tracks: QueueTrack[];
  current: QueueTrack | null;
}

export interface LavalinkConfig {
  host: string;
  port: number;
  password: string;
  secure: boolean;
}

export function createShoukaku(client: SapphireClient, config: LavalinkConfig): Shoukaku {
  const nodes: NodeOption[] = [
    {
      name: 'main',
      url: `${config.host}:${String(config.port)}`,
      auth: config.password,
      secure: config.secure,
    },
  ];

  return new Shoukaku(new Connectors.DiscordJS(client), nodes, {
    // Lavalink with OAuth can take ~60s to start; default 5 tries is not enough.
    reconnectTries: 30,
    reconnectInterval: 5,
    restTimeout: 60,
    moveOnDisconnect: false,
  });
}

export class MusicService {
  private readonly queues = new Map<string, GuildQueueState>();
  private readonly advancing = new Set<string>();
  private readonly playSelections = new Map<string, CachedPlaySelection>();
  private readonly searchCache = new Map<string, { hits: CachedPlaySelection[]; expiresAt: number }>();

  private static readonly PLAY_TOKEN_TTL_MS = 5 * 60_000;
  private static readonly SEARCH_CACHE_TTL_MS = 30_000;
  private static readonly AUTOCOMPLETE_MAX = 25;

  public constructor(
    private readonly shoukaku: Shoukaku,
    private readonly logger: Logger,
    private readonly downloadService: MusicDownloadService | null = null,
  ) {
    this.shoukaku.on('ready', (name) => {
      this.logger.info({ node: name }, 'Lavalink node ready');
    });
    this.shoukaku.on('error', (name, error) => {
      this.logger.error({ node: name, err: error }, 'Lavalink node error');
    });
    this.shoukaku.on('close', (name, code, reason) => {
      this.logger.warn({ node: name, code, reason }, 'Lavalink node closed');
    });
    this.shoukaku.on('disconnect', (name, count) => {
      this.logger.warn({ node: name, count }, 'Lavalink node disconnected');
    });
  }

  public get isReady(): boolean {
    return Boolean(this.shoukaku.getIdealNode());
  }

  public async join(input: {
    guildId: string;
    channelId: string;
    shardId: number;
  }): Promise<Result<true, MusicError>> {
    if (!this.shoukaku.getIdealNode()) {
      return err({ code: 'NO_NODE' });
    }

    const existing = this.shoukaku.players.get(input.guildId);
    if (existing) {
      await this.shoukaku.leaveVoiceChannel(input.guildId);
    }

    const player = await this.shoukaku.joinVoiceChannel({
      guildId: input.guildId,
      channelId: input.channelId,
      shardId: input.shardId,
      deaf: true,
    });
    this.attachPlayerEvents(player);
    this.ensureQueue(input.guildId);
    return ok(true);
  }

  public async leave(guildId: string): Promise<Result<true, MusicError>> {
    const state = this.queues.get(guildId);
    if (state) {
      await this.cleanupTrackFile(state.current);
      for (const track of state.tracks) {
        await this.cleanupTrackFile(track);
      }
    }
    this.queues.delete(guildId);
    if (!this.shoukaku.players.has(guildId) && !this.shoukaku.connections.has(guildId)) {
      return err({ code: 'NOT_CONNECTED' });
    }
    await this.shoukaku.leaveVoiceChannel(guildId);
    return ok(true);
  }

  public async play(input: {
    guildId: string;
    channelId: string;
    shardId: number;
    query: string;
    requesterId: string;
  }): Promise<Result<{ queued: boolean; track: QueueTrack }, MusicError>> {
    if (!this.shoukaku.players.has(input.guildId)) {
      const joined = await this.join({
        guildId: input.guildId,
        channelId: input.channelId,
        shardId: input.shardId,
      });
      if (!joined.ok) {
        return joined;
      }
    }

    const resolved = await this.resolveForPlay(input.query, input.requesterId);
    if (!resolved.ok) {
      return resolved;
    }

    const track = resolved.value;
    const state = this.ensureQueue(input.guildId);
    const player = this.shoukaku.players.get(input.guildId);
    if (!player) {
      return err({ code: 'NOT_CONNECTED' });
    }

    // Ensure listeners exist even if the player was created earlier.
    this.attachPlayerEvents(player);

    if (state.current || player.track) {
      state.tracks.push(track);
      return ok({ queued: true, track });
    }

    await this.startTrack(player, track);
    return ok({ queued: false, track });
  }

  public async pause(guildId: string): Promise<Result<true, MusicError>> {
    const player = this.shoukaku.players.get(guildId);
    if (!player?.track) {
      return err({ code: 'NOTHING_PLAYING' });
    }
    await player.setPaused(true);
    return ok(true);
  }

  public async resume(guildId: string): Promise<Result<true, MusicError>> {
    const player = this.shoukaku.players.get(guildId);
    if (!player?.track) {
      return err({ code: 'NOTHING_PLAYING' });
    }
    await player.setPaused(false);
    return ok(true);
  }

  public async skip(guildId: string): Promise<Result<{ skipped: QueueTrack | null }, MusicError>> {
    const player = this.shoukaku.players.get(guildId);
    if (!player) {
      return err({ code: 'NOT_CONNECTED' });
    }
    const state = this.ensureQueue(guildId);
    const skipped = state.current;
    await this.cleanupTrackFile(skipped);
    await player.stopTrack();
    return ok({ skipped });
  }

  public getQueue(guildId: string): { current: QueueTrack | null; upcoming: QueueTrack[] } {
    const state = this.queues.get(guildId);
    return {
      current: state?.current ?? null,
      upcoming: state?.tracks ?? [],
    };
  }

  public nowPlaying(guildId: string): NowPlaying | null {
    const state = this.queues.get(guildId);
    const player = this.shoukaku.players.get(guildId);
    if (!state?.current || !player) {
      return null;
    }
    return { track: state.current, paused: player.paused };
  }

  /** Live search for /play autocomplete. */
  public async searchSuggestions(query: string): Promise<Result<MusicSearchSuggestion[], MusicError>> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return ok([]);
    }

    if (looksLikeUrl(trimmed) || hasSearchPrefix(trimmed)) {
      return ok([]);
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = this.searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return ok(this.toSuggestions(cached.hits));
    }

    const node = this.shoukaku.getIdealNode();
    if (!node) {
      return err({ code: 'NO_NODE' });
    }

    let hits = await this.fetchSearchHits(node, `ytsearch:${trimmed}`, MusicService.AUTOCOMPLETE_MAX);
    if (hits.length === 0) {
      hits = await this.fetchSearchHits(node, `ytmsearch:${trimmed}`, MusicService.AUTOCOMPLETE_MAX);
    }

    this.searchCache.set(cacheKey, {
      hits,
      expiresAt: Date.now() + MusicService.SEARCH_CACHE_TTL_MS,
    });

    return ok(this.toSuggestions(hits));
  }

  private toSuggestions(hits: CachedPlaySelection[]): MusicSearchSuggestion[] {
    return hits.map((hit) => ({
      name: formatSuggestionLabel(hit.title, hit.author, hit.length),
      value: this.suggestionValue(hit),
    }));
  }

  private suggestionValue(hit: CachedPlaySelection): string {
    if (hit.uri && hit.uri.length <= 100) {
      return hit.uri;
    }
    return this.storePlaySelection(hit);
  }

  private storePlaySelection(hit: Omit<CachedPlaySelection, 'expiresAt'>): string {
    this.purgeExpiredSelections();
    const token = `tk:${crypto.randomUUID().slice(0, 8)}`;
    this.playSelections.set(token, {
      ...hit,
      expiresAt: Date.now() + MusicService.PLAY_TOKEN_TTL_MS,
    });
    return token;
  }

  private takePlaySelection(query: string): CachedPlaySelection | null {
    if (!query.startsWith('tk:')) {
      return null;
    }
    const cached = this.playSelections.get(query);
    this.playSelections.delete(query);
    if (!cached || cached.expiresAt <= Date.now()) {
      return null;
    }
    return cached;
  }

  private purgeExpiredSelections(): void {
    const now = Date.now();
    for (const [key, value] of this.playSelections) {
      if (value.expiresAt <= now) {
        this.playSelections.delete(key);
      }
    }
  }

  private async fetchSearchHits(
    node: NonNullable<ReturnType<Shoukaku['getIdealNode']>>,
    identifier: string,
    limit: number,
  ): Promise<CachedPlaySelection[]> {
    let response;
    try {
      response = await node.rest.resolve(identifier);
    } catch {
      return [];
    }

    const tracks = extractSearchTracks(response);
    const expiresAt = Date.now() + MusicService.PLAY_TOKEN_TTL_MS;
    return tracks.slice(0, limit).map((track) => ({
      encoded: track.encoded,
      title: track.info.title,
      author: track.info.author,
      uri: track.info.uri ?? null,
      length: track.info.length,
      expiresAt,
    }));
  }

  private async resolveLocalFile(
    node: NonNullable<ReturnType<Shoukaku['getIdealNode']>>,
    lavalinkPath: string,
  ): Promise<Result<Track, MusicError>> {
    const attempts = [lavalinkPath, `file://${lavalinkPath}`];
    for (const identifier of attempts) {
      const loaded = await this.resolveIdentifier(node, identifier);
      if (loaded.ok) {
        return loaded;
      }
    }
    return err({
      code: 'RESOLVE_FAILED',
      message: `Lavalink cannot read local file at ${lavalinkPath}. Recreate Lavalink: docker compose up -d --force-recreate`,
    });
  }

  private async resolveForPlay(
    query: string,
    requesterId: string,
  ): Promise<Result<QueueTrack, MusicError>> {
    if (this.downloadService) {
      const tokenHit = this.takePlaySelection(query);
      const downloadQuery = tokenHit
        ? (tokenHit.uri ?? `${tokenHit.title} ${tokenHit.author}`)
        : query;

      return this.resolveViaDownload(downloadQuery, requesterId);
    }

    const cached = this.takePlaySelection(query);
    if (cached) {
      return ok({
        encoded: cached.encoded,
        title: cached.title,
        author: cached.author,
        uri: cached.uri,
        length: cached.length,
        requesterId,
      });
    }

    const resolved = await this.resolveTrack(query);
    if (!resolved.ok) {
      return resolved;
    }
    return ok(toQueueTrack(resolved.value, requesterId));
  }

  private async resolveViaDownload(
    query: string,
    requesterId: string,
  ): Promise<Result<QueueTrack, MusicError>> {
    if (!this.downloadService) {
      return err({ code: 'NO_RESULTS' });
    }

    const node = this.shoukaku.getIdealNode();
    if (!node) {
      return err({ code: 'NO_NODE' });
    }

    const downloaded = await this.downloadService.download(query);
    if (!downloaded.ok) {
      return err({
        code: 'RESOLVE_FAILED',
        message:
          downloaded.error.code === 'YTDLP_MISSING'
            ? 'yt-dlp is not installed'
            : downloaded.error.message,
      });
    }

    const media = downloaded.value;
    const loaded = await this.resolveLocalFile(node, media.lavalinkPath);
    if (!loaded.ok) {
      await this.downloadService.delete(media.hostPath);
      return loaded;
    }

    const track = toQueueTrack(loaded.value, requesterId);
    track.localHostPath = media.hostPath;
    track.title = media.title;
    track.author = media.author;
    track.length = media.length;
    track.uri = media.uri;
    this.logger.info({ title: track.title, path: media.hostPath }, 'Playing downloaded track');
    return ok(track);
  }

  private async cleanupTrackFile(track: QueueTrack | null | undefined): Promise<void> {
    if (!track?.localHostPath || !this.downloadService) {
      return;
    }
    const path = track.localHostPath;
    delete track.localHostPath;
    await this.downloadService.delete(path);
  }

  private async resolveTrack(query: string): Promise<Result<Track, MusicError>> {
    const node = this.shoukaku.getIdealNode();
    if (!node) {
      return err({ code: 'NO_NODE' });
    }

    if (isSoundCloudUrl(query)) {
      return this.resolveSoundCloudViaYoutube(node, query);
    }

    if (looksLikeUrl(query) || hasSearchPrefix(query)) {
      return this.resolveIdentifier(node, query);
    }

    const ytResult = await this.resolveIdentifier(node, `ytsearch:${query}`);
    if (ytResult.ok || ytResult.error.code !== 'NO_RESULTS') {
      return ytResult;
    }
    const ytmResult = await this.resolveIdentifier(node, `ytmsearch:${query}`);
    if (ytmResult.ok || ytmResult.error.code !== 'NO_RESULTS') {
      return ytmResult;
    }
    return this.resolveIdentifier(node, `scsearch:${query}`);
  }

  /** SoundCloud streams 404 in Lavaplayer 2.2.6 — mirror metadata to YouTube when possible. */
  private async resolveSoundCloudViaYoutube(
    node: NonNullable<ReturnType<Shoukaku['getIdealNode']>>,
    url: string,
  ): Promise<Result<Track, MusicError>> {
    const scResult = await this.resolveIdentifier(node, url);
    if (!scResult.ok) {
      return scResult;
    }

    const { title, author } = scResult.value.info;
    const ytResult = await this.resolveIdentifier(node, `ytsearch:${title} ${author}`);
    if (ytResult.ok) {
      this.logger.info({ title, author }, 'SoundCloud URL mirrored to YouTube for playback');
      return ytResult;
    }

    return scResult;
  }

  private async resolveIdentifier(
    node: NonNullable<ReturnType<Shoukaku['getIdealNode']>>,
    identifier: string,
  ): Promise<Result<Track, MusicError>> {
    let response;
    try {
      response = await node.rest.resolve(identifier);
    } catch (error: unknown) {
      return err({
        code: 'RESOLVE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown resolve error',
      });
    }

    if (!response) {
      return err({ code: 'NO_RESULTS' });
    }

    if (response.loadType === LoadType.TRACK) {
      return ok(response.data);
    }
    if (response.loadType === LoadType.SEARCH || response.loadType === LoadType.PLAYLIST) {
      const tracks =
        response.loadType === LoadType.SEARCH ? response.data : response.data.tracks;
      const first = tracks[0];
      if (!first) {
        return err({ code: 'NO_RESULTS' });
      }
      return ok(first);
    }
    if (response.loadType === LoadType.ERROR) {
      return err({ code: 'RESOLVE_FAILED', message: response.data.message });
    }
    return err({ code: 'NO_RESULTS' });
  }

  private async startTrack(player: Player, track: QueueTrack): Promise<void> {
    const state = this.ensureQueue(player.guildId);
    state.current = track;
    await player.playTrack({ track: { encoded: track.encoded } });
  }

  private attachPlayerEvents(player: Player): void {
    player.removeAllListeners('end');
    player.removeAllListeners('exception');
    player.removeAllListeners('stuck');

    player.on('end', (event: TrackEndEvent) => {
      this.logger.info(
        { guildId: player.guildId, reason: event.reason },
        'Track ended',
      );
      void this.finishTrack(player.guildId, event.reason === 'replaced');
    });

    player.on('exception', (event) => {
      const message = event.exception.message;
      this.logger.error(
        { guildId: player.guildId, error: event.exception },
        'Track exception',
      );
      if (message.includes('requires login') || message.includes('All clients failed')) {
        this.logger.warn(
          { guildId: player.guildId },
          'YouTube blocked playback — try another result or enable OAuth (docs/lavalink.md)',
        );
      }
      void this.handlePlaybackFailure(player);
    });

    player.on('stuck', (event) => {
      this.logger.warn(
        { guildId: player.guildId, thresholdMs: event.thresholdMs },
        'Track stuck',
      );
      void this.handlePlaybackFailure(player);
    });
  }

  private async finishTrack(guildId: string, replaced: boolean): Promise<void> {
    const state = this.ensureQueue(guildId);
    await this.cleanupTrackFile(state.current);
    await this.advanceQueue(guildId, replaced);
  }

  private async handlePlaybackFailure(player: Player): Promise<void> {
    const guildId = player.guildId;
    if (this.advancing.has(guildId)) {
      return;
    }

    const state = this.ensureQueue(guildId);
    const failed = state.current;
    await this.cleanupTrackFile(failed);
    if (failed && isSoundCloudUri(failed.uri) && !this.downloadService) {
      const recovered = await this.tryYoutubeFallback(player, failed);
      if (recovered) {
        return;
      }
    }

    await this.advanceQueue(guildId, false);
  }

  private async tryYoutubeFallback(player: Player, failed: QueueTrack): Promise<boolean> {
    const node = this.shoukaku.getIdealNode();
    if (!node) {
      return false;
    }

    const resolved = await this.resolveIdentifier(node, `ytsearch:${failed.title} ${failed.author}`);
    if (!resolved.ok) {
      return false;
    }

    try {
      const track = toQueueTrack(resolved.value, failed.requesterId);
      await this.startTrack(player, track);
      this.logger.info(
        { guildId: player.guildId, title: track.title },
        'Recovered SoundCloud failure via YouTube',
      );
      return true;
    } catch (error: unknown) {
      this.logger.error({ err: error, guildId: player.guildId }, 'YouTube fallback failed');
      return false;
    }
  }

  private async advanceQueue(guildId: string, skip: boolean): Promise<void> {
    if (skip || this.advancing.has(guildId)) {
      return;
    }

    this.advancing.add(guildId);
    try {
      const state = this.ensureQueue(guildId);
      await this.cleanupTrackFile(state.current);
      state.current = null;
      const next = state.tracks.shift();
      const player = this.shoukaku.players.get(guildId);
      if (!next || !player) {
        return;
      }

      try {
        await this.startTrack(player, next);
        this.logger.info({ guildId, title: next.title }, 'Started next queued track');
      } catch (error: unknown) {
        this.logger.error({ err: error, guildId }, 'Failed to start next track');
        this.advancing.delete(guildId);
        await this.advanceQueue(guildId, false);
      }
    } finally {
      this.advancing.delete(guildId);
    }
  }

  private ensureQueue(guildId: string): GuildQueueState {
    const existing = this.queues.get(guildId);
    if (existing) {
      return existing;
    }
    const created: GuildQueueState = { tracks: [], current: null };
    this.queues.set(guildId, created);
    return created;
  }
}

function toQueueTrack(track: Track, requesterId: string): QueueTrack {
  return {
    encoded: track.encoded,
    title: track.info.title,
    author: track.info.author,
    uri: track.info.uri ?? null,
    length: track.info.length,
    requesterId,
  };
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isSoundCloudUrl(value: string): boolean {
  return /^https?:\/\/(www\.)?soundcloud\.com\//i.test(value);
}

function isSoundCloudUri(uri: string | null): boolean {
  return uri !== null && /soundcloud\.com/i.test(uri);
}

function hasSearchPrefix(value: string): boolean {
  return /^(scsearch|ytsearch|ytmsearch):/i.test(value);
}

export function formatTrackDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${seconds.toString().padStart(2, '0')}`;
}

export function formatSuggestionLabel(title: string, author: string, lengthMs: number): string {
  const label = `${title} — ${author} · ${formatTrackDuration(lengthMs)}`;
  return label.length <= 100 ? label : `${label.slice(0, 97)}...`;
}

function extractSearchTracks(
  response: Awaited<
    ReturnType<NonNullable<ReturnType<Shoukaku['getIdealNode']>>['rest']['resolve']>
  >,
): Track[] {
  if (!response) {
    return [];
  }
  if (response.loadType === LoadType.SEARCH) {
    return response.data;
  }
  if (response.loadType === LoadType.PLAYLIST) {
    return response.data.tracks;
  }
  if (response.loadType === LoadType.TRACK) {
    return [response.data];
  }
  return [];
}
