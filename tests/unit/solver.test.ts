import { describe, expect, it } from 'vitest';
import { countSolutions, solve } from '../../src/game/solver';
import { CLASSIC, CLASSIC_SOLUTION, EMPTY } from './fixtures';

describe('solver', () => {
  it('resolve o puzzle clássico', () => {
    expect(solve(CLASSIC)).toEqual(CLASSIC_SOLUTION);
  });

  it('o puzzle clássico tem solução única', () => {
    expect(countSolutions(CLASSIC)).toBe(1);
  });

  it('o tabuleiro vazio tem mais de uma solução (para no limite)', () => {
    expect(countSolutions(EMPTY, 2)).toBe(2);
  });

  it('um puzzle com conflito não tem solução', () => {
    const broken = [...CLASSIC];
    broken[2] = 5;
    expect(countSolutions(broken)).toBe(0);
    expect(solve(broken)).toBeNull();
  });

  it('a solução sem uma casa continua única', () => {
    const almost = [...CLASSIC_SOLUTION];
    almost[40] = 0;
    expect(countSolutions(almost)).toBe(1);
  });

  it('não altera o tabuleiro recebido', () => {
    const copy = [...CLASSIC];
    solve(copy);
    expect(copy).toEqual(CLASSIC);
  });
});
