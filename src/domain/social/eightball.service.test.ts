import { describe, expect, it } from 'bun:test';
import { EightBallService } from './eightball.service.js';

describe('EightBallService', () => {
  it('devuelve una respuesta determinista con RNG fijo', () => {
    const service = new EightBallService(['Yes.', 'No.'], () => 0);
    const result = service.answer('Will it work?');
    expect(result.question).toBe('Will it work?');
    expect(result.answer).toBe('Yes.');
  });
});
