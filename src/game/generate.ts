import { cloneGrid, digits, fromValues, placeDigit, type CandidateGrid } from './candidates';
import { grade, levelIndex, type Level } from './grade';
import { CELLS } from './grid';
import { createRandom, shuffle, type Random } from './random';
import { countSolutions } from './solver';

function fill(grid: CandidateGrid, random: Random): CandidateGrid | null {
  const cell = grid.values.indexOf(0);
  if (cell === -1) return grid;
  for (const digit of shuffle(digits(grid.candidates[cell]!), random)) {
    const next = cloneGrid(grid);
    placeDigit(next, cell, digit);
    const done = fill(next, random);
    if (done) return done;
  }
  return null;
}

/** Uma grade completa e válida, embaralhada a partir do gerador. */
export function generateSolution(random: Random): number[] {
  const solved = fill(fromValues(Array<number>(CELLS).fill(0)), random);
  if (!solved) throw new Error('Could not build a solution.');
  return solved.values;
}

export interface Generated {
  readonly seed: number;
  readonly puzzle: number[];
  readonly solution: number[];
}

/**
 * Tira números em ordem aleatória. Uma retirada só fica se o puzzle continua com solução única e com nível
 * até `level`. No fim, o puzzle só é aceito se o nível for exatamente `level`; senão, devolve null.
 */
export function generateForLevel(seed: number, level: Level): Generated | null {
  const random = createRandom(seed);
  const solution = generateSolution(random);
  const puzzle = [...solution];
  const target = levelIndex(level);
  for (const cell of shuffle(
    Array.from({ length: CELLS }, (_, i) => i),
    random,
  )) {
    const kept = puzzle[cell]!;
    puzzle[cell] = 0;
    const graded = grade(puzzle);
    if (countSolutions(puzzle) !== 1 || graded === null || levelIndex(graded) > target) puzzle[cell] = kept;
  }
  return grade(puzzle) === level ? { seed, puzzle, solution } : null;
}
