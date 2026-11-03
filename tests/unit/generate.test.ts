import { describe, expect, it } from 'vitest';
import { generateForLevel, generateSolution, type Generated } from '../../src/game/generate';
import { grade } from '../../src/game/grade';
import { createRandom } from '../../src/game/random';
import { countSolutions } from '../../src/game/solver';
import { isValidSolution } from './fixtures';

describe('random', () => {
  it('é determinístico e fica entre 0 e 1', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    for (const value of first) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('generateSolution', () => {
  it('gera uma grade completa e válida, igual para a mesma semente', () => {
    const solution = generateSolution(createRandom(7));
    expect(isValidSolution(solution)).toBe(true);
    expect(generateSolution(createRandom(7))).toEqual(solution);
    expect(generateSolution(createRandom(8))).not.toEqual(solution);
  });
});

describe('generateForLevel', () => {
  it('gera puzzles Easy e Medium com solução única e no nível pedido', () => {
    for (const level of ['easy', 'medium'] as const) {
      let found: Generated | null = null;
      for (let seed = 1; seed <= 30 && !found; seed++) found = generateForLevel(seed, level);
      expect(found).not.toBeNull();
      expect(countSolutions(found!.puzzle)).toBe(1);
      expect(grade(found!.puzzle)).toBe(level);
      expect(isValidSolution(found!.solution)).toBe(true);
    }
  });

  it('a mesma semente gera o mesmo puzzle', () => {
    expect(generateForLevel(3, 'easy')).toEqual(generateForLevel(3, 'easy'));
  });
});
