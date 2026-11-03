import { describe, expect, it } from 'vitest';
import { conflicts, isSolved } from '../../src/game/validate';
import { CLASSIC, CLASSIC_SOLUTION } from './fixtures';

describe('validate', () => {
  it('o puzzle original não tem conflitos', () => {
    expect(conflicts(CLASSIC).size).toBe(0);
  });

  it('marca as duas casas de um número repetido', () => {
    const values = [...CLASSIC];
    values[2] = 5;
    expect([...conflicts(values)].sort((a, b) => a - b)).toEqual([0, 2]);
  });

  it('isSolved só é verdadeiro com o tabuleiro completo e sem conflitos', () => {
    expect(isSolved(CLASSIC_SOLUTION)).toBe(true);
    expect(isSolved(CLASSIC)).toBe(false);
    const wrong = [...CLASSIC_SOLUTION];
    [wrong[0], wrong[1]] = [wrong[1]!, wrong[0]!];
    expect(isSolved(wrong)).toBe(false);
  });
});
