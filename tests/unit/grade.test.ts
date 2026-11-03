import { describe, expect, it } from 'vitest';
import { LEVELS, grade } from '../../src/game/grade';
import { CLASSIC, CLASSIC_SOLUTION, EMPTY } from './fixtures';

describe('grade', () => {
  it('a solução completa é Easy', () => {
    expect(grade(CLASSIC_SOLUTION)).toBe('easy');
  });

  it('o puzzle clássico se resolve só com casas e números únicos', () => {
    expect(['easy', 'medium']).toContain(grade(CLASSIC));
  });

  it('o tabuleiro vazio não se resolve por lógica', () => {
    expect(grade(EMPTY)).toBeNull();
  });

  it('a solução sem uma casa é Easy', () => {
    const almost = [...CLASSIC_SOLUTION];
    almost[0] = 0;
    expect(grade(almost)).toBe('easy');
  });

  it('os níveis vêm em ordem', () => {
    expect(LEVELS).toEqual(['easy', 'medium', 'hard', 'expert']);
  });
});
