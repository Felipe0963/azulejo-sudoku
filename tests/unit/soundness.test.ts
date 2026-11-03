import { describe, expect, it } from 'vitest';
import { fromValues, has } from '../../src/game/candidates';
import { LEVELS } from '../../src/game/grade';
import { pickPuzzle } from '../../src/game/bank';
import { solve } from '../../src/game/solver';
import { applyStep } from '../../src/game/techniques/apply-step';
import { hiddenPair } from '../../src/game/techniques/hidden-pair';
import { hiddenSingle } from '../../src/game/techniques/hidden-single';
import { lockedCandidates } from '../../src/game/techniques/locked-candidates';
import { nakedPair } from '../../src/game/techniques/naked-pair';
import { nakedSingle } from '../../src/game/techniques/naked-single';
import type { Step, Technique } from '../../src/game/techniques/types';
import { xWing } from '../../src/game/techniques/x-wing';

const TECHNIQUES: readonly [string, Technique][] = [
  ['nakedSingle', nakedSingle],
  ['hiddenSingle', hiddenSingle],
  ['lockedCandidates', lockedCandidates],
  ['nakedPair', nakedPair],
  ['hiddenPair', hiddenPair],
  ['xWing', xWing],
];
/** Uma amostra do banco (um puzzle a cada 10), para o teste ficar rápido. */
const SAMPLE = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

/**
 * Solidez das técnicas: em cada passo da resolução de puzzles reais, cada técnica (não só a escolhida) só pode
 * colocar o número da solução, só pode eliminar candidatos que existem e que não são da solução, e precisa fazer
 * progresso. Depois de cada passo, o número da solução continua candidato em toda casa vazia.
 */
describe('solidez das técnicas', () => {
  for (const level of LEVELS) {
    it(`nunca contradizem a solução nos puzzles ${level} da amostra`, () => {
      const problems: string[] = [];
      for (const seed of SAMPLE) {
        const puzzle = pickPuzzle(level, seed);
        const solution = solve(puzzle)!;
        const grid = fromValues(puzzle);
        while (grid.values.includes(0)) {
          let first: Step | null = null;
          for (const [name, technique] of TECHNIQUES) {
            const step = technique(grid);
            if (!step) continue;
            first ??= step;
            const where = `${level} #${String(seed)} ${name}`;
            if (step.place && solution[step.place.cell] !== step.place.digit)
              problems.push(`${where}: place`);
            if (!step.place && step.eliminate.length === 0) problems.push(`${where}: no progress`);
            for (const { cell, digit } of step.eliminate) {
              if (solution[cell] === digit) problems.push(`${where}: removes the answer`);
              if (!has(grid.candidates[cell]!, digit)) problems.push(`${where}: removes a missing candidate`);
            }
          }
          if (!first) {
            problems.push(`${level} #${String(seed)}: stuck`);
            break;
          }
          applyStep(grid, first);
          grid.values.forEach((value, cell) => {
            if (value === 0 && !has(grid.candidates[cell]!, solution[cell]!))
              problems.push(`${level} #${String(seed)}: lost the answer at ${String(cell)}`);
          });
        }
        expect(grid.values).toEqual(solution);
      }
      expect(problems).toEqual([]);
    });
  }
});
