import pino from 'pino';
import type { Env } from '../config/env.js';

export function createLogger(env: Env) {
  const transport =
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined;

  return pino({
    level: env.LOG_LEVEL,
    ...(transport ? { transport } : {}),
  });
}

export type Logger = ReturnType<typeof createLogger>;
