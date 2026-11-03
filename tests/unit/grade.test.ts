import { describe, expect, it } from 'vitest';
import { fromValues } from '../../src/game/candidates';
import { LEVELS, grade } from '../../src/game/grade';
import { parse, type Values } from '../../src/game/grid';
import { applyStep } from '../../src/game/techniques/apply-step';
import { hiddenPair } from '../../src/game/techniques/hidden-pair';
import { hiddenSingle } from '../../src/game/techniques/hidden-single';
import { lockedCandidates } from '../../src/game/techniques/locked-candidates';
import { nakedPair } from '../../src/game/techniques/naked-pair';
import { nakedSingle } from '../../src/game/techniques/naked-single';
import type { Technique } from '../../src/game/techniques/types';
import { xWing } from '../../src/game/techniques/x-wing';
import { CLASSIC, CLASSIC_SOLUTION, EMPTY } from './fixtures';

/** Puzzles copiados do banco (primeiro Hard e primeiro Expert), fixos aqui para não depender do banco. */
const HARD = parse('.56.....9....7.62.....5.78..3...1..8...5...4.42........65.1....3....6.1.87.....9.');
const EXPERT = parse('9...2741.25.4......7........12.6...3.....3..1.3.8.4.7..2.....3..47...5..8......67');

const SINGLES = [nakedSingle, hiddenSingle];
const UP_TO_HARD = [...SINGLES, lockedCandidates, nakedPair];
const ALL = [...UP_TO_HARD, hiddenPair, xWing];

/** Resolve só com as técnicas dadas, como o classificador. Devolve se chegou ao fim. */
function solvesWith(values: Values, techniques: readonly Technique[]): boolean {
  const grid = fromValues(values);
  for (;;) {
    if (grid.values.every((value) => value !== 0)) return true;
    const step = techniques.map((technique) => technique(grid)).find((found) => found !== null);
    if (!step) return false;
    applyStep(grid, step);
  }
}

describe('grade', () => {
  it('a solução completa é Easy', () => {
    expect(grade(CLASSIC_SOLUTION)).toBe('easy');
  });

  it('o puzzle clássico é Easy: só casas únicas bastam', () => {
    expect(grade(CLASSIC)).toBe('easy');
    expect(solvesWith(CLASSIC, [nakedSingle])).toBe(true);
  });

  it('um puzzle Hard conhecido trava sem eliminação bloco–linha e pares, e se resolve com elas', () => {
    expect(grade(HARD)).toBe('hard');
    expect(solvesWith(HARD, SINGLES)).toBe(false);
    expect(solvesWith(HARD, UP_TO_HARD)).toBe(true);
  });

  it('um puzzle Expert conhecido trava sem pares ocultos e X-Wing, e se resolve com eles', () => {
    expect(grade(EXPERT)).toBe('expert');
    expect(solvesWith(EXPERT, UP_TO_HARD)).toBe(false);
    expect(solvesWith(EXPERT, ALL)).toBe(true);
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
