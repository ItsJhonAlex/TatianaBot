import { describe, expect, it } from 'bun:test';
import { Database as BunDatabase } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../infrastructure/db/schema/index.js';
import { ConversationRepository } from '../../infrastructure/db/repositories/conversation.repository.js';
import { MockLLMProvider } from '../../infrastructure/llm/mock-provider.js';
import { ChatService } from './chat.service.js';
import { MemoryService } from './memory.service.js';

function createTestDb() {
  const sqlite = new BunDatabase(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, {
    migrationsFolder: join(
      dirname(fileURLToPath(import.meta.url)),
      '../../infrastructure/db/migrations',
    ),
  });
  return db;
}

describe('ChatService + MemoryService', () => {
  it('responde y guarda historial por usuario', async () => {
    const db = createTestDb();
    const memory = new MemoryService(new ConversationRepository(db), 4);
    const chat = new ChatService(new MockLLMProvider('Hola viajero'), memory, 'Eres Tatiana.');

    const first = await chat.reply({
      guildId: 'g1',
      userId: 'u1',
      displayName: 'Alex',
      content: 'Hola',
    });

    expect(first).toBe('Hola viajero');
    expect(memory.getHistory('g1', 'u1')).toHaveLength(2);
    expect(memory.getHistory('g1', 'u2')).toHaveLength(0);
  });

  it('recorta historial al límite', async () => {
    const db = createTestDb();
    const memory = new MemoryService(new ConversationRepository(db), 4);
    const chat = new ChatService(new MockLLMProvider('ok'), memory, 'system');

    for (let i = 0; i < 5; i++) {
      await chat.reply({
        guildId: 'g1',
        userId: 'u1',
        displayName: 'Alex',
        content: `msg ${String(i)}`,
      });
    }

    expect(memory.getHistory('g1', 'u1').length).toBeLessThanOrEqual(4);
  });
});
