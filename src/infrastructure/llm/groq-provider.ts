import Groq from 'groq-sdk';
import type { ChatMessage, CompleteOptions, LLMProvider } from '../../domain/chat/llm-provider.js';

export class GroqProvider implements LLMProvider {
  private readonly client: Groq;

  public constructor(
    apiKey: string,
    private readonly defaultModel = 'openai/gpt-oss-20b',
  ) {
    this.client = new Groq({ apiKey });
  }

  public async complete(messages: ChatMessage[], options: CompleteOptions = {}): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: options.model ?? this.defaultModel,
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
