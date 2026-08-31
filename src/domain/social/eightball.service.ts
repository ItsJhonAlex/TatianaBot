import eightballResponses from '../../content/eightball-responses.json';

export class EightBallService {
  public constructor(
    private readonly responses: readonly string[] = eightballResponses.responses,
    private readonly random: () => number = Math.random,
  ) {}

  public answer(question: string): { question: string; answer: string } {
    const trimmed = question.trim();
    const index = Math.floor(this.random() * this.responses.length);
    const answer = this.responses[index] ?? this.responses[0] ?? 'Ask again later.';

    return { question: trimmed, answer };
  }
}
