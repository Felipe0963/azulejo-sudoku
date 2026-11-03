import { has } from '../candidates';
import { BOXES, COLS, ROWS, boxOf, colOf, rowOf } from '../grid';
import type { Placement, Step, Technique } from './types';

const spotsOf = (grid: Parameters<Technique>[0], unit: readonly number[], digit: number) =>
  unit.filter((cell) => grid.values[cell] === 0 && has(grid.candidates[cell]!, digit));

const eliminations = (grid: Parameters<Technique>[0], cells: readonly number[], digit: number): Placement[] =>
  spotsOf(grid, cells, digit).map((cell) => ({ cell, digit }));

const step = (eliminate: Placement[]): Step | null =>
  eliminate.length > 0 ? { technique: 'pointing', eliminate } : null;

/**
 * Pointing: num bloco, o número só aparece numa linha (ou coluna), então sai do resto dessa linha.
 * Claiming: numa linha (ou coluna), o número só aparece num bloco, então sai do resto do bloco.
 * Ambos contam como a mesma técnica de nível. Varre blocos primeiro, depois linhas e colunas.
 */
export const lockedCandidates: Technique = (grid) => {
  for (const [box, cells] of BOXES.entries()) {
    for (let digit = 1; digit <= 9; digit++) {
      const spots = spotsOf(grid, cells, digit);
      if (spots.length < 2) continue;
      const rows = new Set(spots.map(rowOf));
      if (rows.size === 1) {
        const found = step(
          eliminations(
            grid,
            ROWS[rowOf(spots[0]!)]!.filter((c) => boxOf(c) !== box),
            digit,
          ),
        );
        if (found) return found;
      }
      const cols = new Set(spots.map(colOf));
      if (cols.size === 1) {
        const found = step(
          eliminations(
            grid,
            COLS[colOf(spots[0]!)]!.filter((c) => boxOf(c) !== box),
            digit,
          ),
        );
        if (found) return found;
      }
    }
  }
  for (const line of [...ROWS, ...COLS]) {
    for (let digit = 1; digit <= 9; digit++) {
      const spots = spotsOf(grid, line, digit);
      if (spots.length < 2) continue;
      const boxes = new Set(spots.map(boxOf));
      if (boxes.size !== 1) continue;
      const found = step(
        eliminations(
          grid,
          BOXES[boxOf(spots[0]!)]!.filter((c) => !line.includes(c)),
          digit,
        ),
      );
      if (found) return found;
    }
  }
  return null;
};
