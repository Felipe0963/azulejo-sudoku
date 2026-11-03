import { bit, placeDigit, type CandidateGrid } from '../candidates';
import type { Step } from './types';

/** Aplica um passo à grade. Altera `grid`. */
export function applyStep(grid: CandidateGrid, step: Step): void {
  if (step.place) placeDigit(grid, step.place.cell, step.place.digit);
  for (const { cell, digit } of step.eliminate) grid.candidates[cell]! &= ~bit(digit);
}
