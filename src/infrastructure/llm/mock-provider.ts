import type { ChatMessage, LLMProvider } from '../../domain/chat/llm-provider.js';

/** Provider de prueba: echo controlado para tests. */
export class MockLLMProvider implements LLMProvider {
  public constructor(private readonly response = 'Hola desde Aethoria.') {}

  public complete(messages: ChatMessage[]): Promise<string> {
    // Usa messages solo para mantener la firma del puerto LLMProvider.
    return Promise.resolve(messages.length >= 0 ? this.response : this.response);
  }
}
