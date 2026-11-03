import { has } from '../candidates';
import { UNITS } from '../grid';
import type { Technique } from './types';

/** Número que só cabe numa casa de uma linha, coluna ou bloco. */
export const hiddenSingle: Technique = (grid) => {
  for (const unit of UNITS) {
    for (let digit = 1; digit <= 9; digit++) {
      if (unit.some((cell) => grid.values[cell] === digit)) continue;
      const spots = unit.filter((cell) => grid.values[cell] === 0 && has(grid.candidates[cell]!, digit));
      if (spots.length === 1)
        return { technique: 'hiddenSingle', place: { cell: spots[0]!, digit }, eliminate: [] };
    }
  }
  return null;
};
