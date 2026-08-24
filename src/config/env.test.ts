import { describe, expect, it } from 'vitest';
import { parseEnv, resolveDatabasePath } from './env.js';

describe('parseEnv', () => {
  it('acepta configuración mínima válida', () => {
    const env = parseEnv({
      DISCORD_TOKEN: 'test-token',
      GROQ_API_KEY: 'test-groq',
      AUTHORIZED_USER_ID: '123456789012345678',
    });

    expect(env.DISCORD_TOKEN).toBe('test-token');
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe('file:./data/tatiana.db');
  });

  it('falla con mensaje claro si falta DISCORD_TOKEN', () => {
    expect(() =>
      parseEnv({
        GROQ_API_KEY: 'test-groq',
        AUTHORIZED_USER_ID: '123456789012345678',
      }),
    ).toThrow(/DISCORD_TOKEN/);
  });

  it('falla si AUTHORIZED_USER_ID no es numérico', () => {
    expect(() =>
      parseEnv({
        DISCORD_TOKEN: 'test-token',
        GROQ_API_KEY: 'test-groq',
        AUTHORIZED_USER_ID: 'not-a-id',
      }),
    ).toThrow(/AUTHORIZED_USER_ID/);
  });
});

describe('resolveDatabasePath', () => {
  it('extrae la ruta del esquema file:', () => {
    expect(resolveDatabasePath('file:./data/tatiana.db')).toBe('./data/tatiana.db');
  });

  it('rechaza URLs que no sean file:', () => {
    expect(() => resolveDatabasePath('postgres://localhost/db')).toThrow(/file:/);
  });
});
