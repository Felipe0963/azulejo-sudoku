import { describe, expect, it } from 'vitest';
import { conflicts } from '../../src/game/validate';
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

  it('a solução não tem conflitos; trocar dois números da linha cria conflitos nas colunas', () => {
    expect(conflicts(CLASSIC_SOLUTION).size).toBe(0);
    const wrong = [...CLASSIC_SOLUTION];
    [wrong[0], wrong[1]] = [wrong[1]!, wrong[0]!];
    expect(conflicts(wrong).size).toBeGreaterThan(0);
  });
});
