import type { ConversationRepository } from '../../infrastructure/db/repositories/conversation.repository.js';
import type { ChatMessage } from './llm-provider.js';

/** Máximo de mensajes de historial (user+assistant) por conversación. */
export const DEFAULT_HISTORY_LIMIT = 20;

export class MemoryService {
  public constructor(
    private readonly conversations: ConversationRepository,
    private readonly historyLimit = DEFAULT_HISTORY_LIMIT,
  ) {}

  public getHistory(guildId: string, userId: string): ChatMessage[] {
    return this.conversations.listRecent(guildId, userId, this.historyLimit).map((row) => ({
      role: row.role,
      content: row.content,
    }));
  }

  public remember(
    guildId: string,
    userId: string,
    userContent: string,
    assistantContent: string,
  ): void {
    this.conversations.append(guildId, userId, 'user', userContent);
    this.conversations.append(guildId, userId, 'assistant', assistantContent);
    this.conversations.deleteOldestBeyond(guildId, userId, this.historyLimit);
  }
}
