import { z } from 'zod';

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN es requerido'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY es requerido'),
  GROQ_MODEL: z.string().min(1).default('openai/gpt-oss-20b'),
  AUTHORIZED_USER_ID: z
    .string()
    .regex(/^\d+$/, 'AUTHORIZED_USER_ID debe ser un ID numérico de Discord'),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATABASE_URL: z.string().default('file:./data/tatiana.db'),

  DEV_GUILD_ID: z
    .string()
    .regex(/^\d+$/, 'DEV_GUILD_ID debe ser un ID numérico')
    .optional(),
  STATUS_CHANNEL_ID: z
    .string()
    .regex(/^\d+$/, 'STATUS_CHANNEL_ID debe ser un ID numérico')
    .optional(),

  LAVALINK_HOST: z.string().min(1).optional(),
  LAVALINK_PORT: z.coerce.number().int().positive().default(2333),
  LAVALINK_PASSWORD: z.string().min(1).optional(),
  LAVALINK_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  /** Descarga con yt-dlp → reproduce local → borra (estilo bots Telegram). */
  MUSIC_USE_DOWNLOAD: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  MUSIC_CACHE_DIR: z.string().min(1).default('./data/music-cache'),
  /** Ruta del cache dentro del contenedor Lavalink (debe coincidir con docker-compose). */
  LAVALINK_CACHE_DIR: z.string().min(1).default('/music-cache'),
  YTDLP_PATH: z.string().min(1).default('yt-dlp'),
  /** Ej: firefox, chrome — evita "Sign in to confirm you're not a bot" en YouTube. */
  YTDLP_COOKIES_FROM_BROWSER: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(input);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Configuración inválida:\n${formatted}`);
  }

  return result.data;
}

/** Resuelve la ruta del archivo SQLite desde DATABASE_URL (`file:./data/tatiana.db`). */
export function resolveDatabasePath(databaseUrl: string): string {
  if (!databaseUrl.startsWith('file:')) {
    throw new Error(`DATABASE_URL debe usar el esquema file: (recibido: ${databaseUrl})`);
  }

  return databaseUrl.slice('file:'.length);
}
