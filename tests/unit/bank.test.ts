import { describe, expect, it } from 'vitest';
import { bankSize, pickPuzzle } from '../../src/game/bank';
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
});
