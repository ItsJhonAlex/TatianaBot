import Groq from 'groq-sdk';
import type { ChatMessage, CompleteOptions, LLMProvider } from '../../domain/chat/llm-provider.js';

const DEFAULT_MODEL = 'llama-3.1-8b-instant';

export class GroqProvider implements LLMProvider {
  private readonly client: Groq;

  public constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  public async complete(messages: ChatMessage[], options: CompleteOptions = {}): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: options.model ?? DEFAULT_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      throw new Error('Groq no devolvió contenido');
    }

    return content.trim();
  }
}
