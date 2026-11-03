import { describe, expect, it } from 'vitest';
import { bankSize, pickPuzzle, seedOf } from '../../src/game/bank';
import { LEVELS, grade } from '../../src/game/grade';
import { countSolutions } from '../../src/game/solver';

describe('bank', () => {
  for (const level of LEVELS) {
    it(`todo puzzle ${level} tem solução única e está no nível ${level}`, () => {
      expect(bankSize(level)).toBeGreaterThanOrEqual(30);
      for (let index = 0; index < bankSize(level); index++) {
        const puzzle = pickPuzzle(level, index);
        expect(countSolutions(puzzle)).toBe(1);
        expect(grade(puzzle)).toBe(level);
      }
    });
  }

  it('a semente escolhe o puzzle de forma estável', () => {
    expect(pickPuzzle('hard', 5)).toEqual(pickPuzzle('hard', 5 + bankSize('hard')));
  });

  it('seedOf devolve uma semente positiva que escolhe o mesmo puzzle', () => {
    for (const index of [0, 7]) {
      const seed = seedOf('medium', pickPuzzle('medium', index))!;
      expect(seed).toBeGreaterThan(0);
      expect(pickPuzzle('medium', seed)).toEqual(pickPuzzle('medium', index));
    }
    expect(seedOf('medium', Array<number>(81).fill(0))).toBeNull();
  });
});
