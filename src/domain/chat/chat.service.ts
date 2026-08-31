import type { LLMProvider } from './llm-provider.js';
import type { MemoryService } from './memory.service.js';

export interface ChatRequest {
  guildId: string;
  userId: string;
  displayName: string;
  content: string;
}

export class ChatService {
  public constructor(
    private readonly llm: LLMProvider,
    private readonly memory: MemoryService,
    private readonly systemPrompt: string,
  ) {}

  public async reply(request: ChatRequest): Promise<string> {
    const history = this.memory.getHistory(request.guildId, request.userId);
    const userLine = `${request.displayName}: ${request.content}`;

    const messages = [
      { role: 'system' as const, content: this.systemPrompt },
      ...history,
      { role: 'user' as const, content: userLine },
    ];

    const response = await this.llm.complete(messages);
    this.memory.remember(request.guildId, request.userId, userLine, response);
    return response;
  }
}
