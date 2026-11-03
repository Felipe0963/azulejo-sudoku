import { cloneGrid, count, digits, fromValues, placeDigit, type CandidateGrid } from './candidates';
import type { Values } from './grid';
import { conflicts } from './validate';

/** Casa vazia com menos candidatos, ou -1 se não há casa vazia. */
function mostConstrained(grid: CandidateGrid): number {
  let best = -1;
  let fewest = 10;
  for (let cell = 0; cell < grid.values.length; cell++) {
    if (grid.values[cell] !== 0) continue;
    const options = count(grid.candidates[cell]!);
    if (options < fewest) {
      fewest = options;
      best = cell;
      if (options <= 1) break;
    }
  }
  return best;
}

/**
 * Busca em profundidade, sempre pela casa com menos candidatos. `onSolution` recebe cada solução e
 * devolve `true` para parar. Devolve `true` se a busca foi interrompida.
 */
function search(grid: CandidateGrid, onSolution: (values: number[]) => boolean): boolean {
  const cell = mostConstrained(grid);
  if (cell === -1) return onSolution(grid.values);
  for (const digit of digits(grid.candidates[cell]!)) {
    const next = cloneGrid(grid);
    placeDigit(next, cell, digit);
    if (search(next, onSolution)) return true;
  }
  return false;
}

/** Primeira solução encontrada, ou null. Não altera `values`. */
export function solve(values: Values): number[] | null {
  if (conflicts(values).size > 0) return null;
  let found: number[] | null = null;
  search(fromValues(values), (solution) => {
    found = [...solution];
    return true;
  });
  return found;
}

/** Número de soluções, contando até `limit` (2 basta para saber se é única). */
export function countSolutions(values: Values, limit = 2): number {
  if (conflicts(values).size > 0) return 0;
  let total = 0;
  search(fromValues(values), () => {
    total++;
    return total >= limit;
  });
  return total;
}
