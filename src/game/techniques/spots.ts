import { has, type CandidateGrid } from '../candidates';

/** Casas vazias de `cells` que ainda têm `digit` entre os candidatos. */
export const spotsOf = (grid: Readonly<CandidateGrid>, cells: readonly number[], digit: number): number[] =>
  cells.filter((cell) => grid.values[cell] === 0 && has(grid.candidates[cell]!, digit));
