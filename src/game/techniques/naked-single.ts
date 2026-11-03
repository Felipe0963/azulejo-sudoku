import { count, digits } from '../candidates';
import type { Technique } from './types';

/** Casa vazia com um único candidato. */
export const nakedSingle: Technique = (grid) => {
  for (let cell = 0; cell < grid.values.length; cell++) {
    if (grid.values[cell] === 0 && count(grid.candidates[cell]!) === 1) {
      return {
        technique: 'nakedSingle',
        place: { cell, digit: digits(grid.candidates[cell]!)[0]! },
        eliminate: [],
      };
    }
  }
  return null;
};
