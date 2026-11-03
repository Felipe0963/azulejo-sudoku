import { count, digits, has } from '../candidates';
import { UNITS } from '../grid';
import type { Placement, Technique } from './types';

/** Duas casas de uma unidade com o mesmo par de candidatos: esses números saem das outras casas. */
export const nakedPair: Technique = (grid) => {
  for (const unit of UNITS) {
    const pairs = unit.filter((cell) => grid.values[cell] === 0 && count(grid.candidates[cell]!) === 2);
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const mask = grid.candidates[pairs[i]!]!;
        if (mask !== grid.candidates[pairs[j]!]) continue;
        const eliminate: Placement[] = [];
        for (const cell of unit) {
          if (cell === pairs[i] || cell === pairs[j] || grid.values[cell] !== 0) continue;
          for (const digit of digits(mask))
            if (has(grid.candidates[cell]!, digit)) eliminate.push({ cell, digit });
        }
        if (eliminate.length > 0) return { technique: 'nakedPair', eliminate };
      }
    }
  }
  return null;
};
