export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CompleteOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  complete(messages: ChatMessage[], options?: CompleteOptions): Promise<string>;
}
