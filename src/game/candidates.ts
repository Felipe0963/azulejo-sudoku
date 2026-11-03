import { CELLS, PEERS, type Values } from './grid';

/** Todos os candidatos, de 1 a 9. */
export const ALL = 0x1ff;

export const bit = (digit: number): number => 1 << (digit - 1);
export const has = (mask: number, digit: number): boolean => (mask & bit(digit)) !== 0;

export function count(mask: number): number {
  let total = 0;
  for (let m = mask; m !== 0; m &= m - 1) total++;
  return total;
}

export function digits(mask: number): number[] {
  const result: number[] = [];
  for (let digit = 1; digit <= 9; digit++) if (has(mask, digit)) result.push(digit);
  return result;
}

/** Números colocados e candidatos de cada casa vazia (0 nas casas preenchidas). Usada pelo solucionador e pelas técnicas. */
export interface CandidateGrid {
  values: number[];
  candidates: number[];
}

export function fromValues(values: Values): CandidateGrid {
  const candidates = Array.from({ length: CELLS }, (_, cell) => {
    if (values[cell] !== 0) return 0;
    let mask = ALL;
    for (const peer of PEERS[cell]!) if (values[peer]! !== 0) mask &= ~bit(values[peer]!);
    return mask;
  });
  return { values: [...values], candidates };
}

export const cloneGrid = (grid: Readonly<CandidateGrid>): CandidateGrid => ({
  values: [...grid.values],
  candidates: [...grid.candidates],
});

/** Coloca um número e o tira dos candidatos dos vizinhos. Altera `grid`. */
export function placeDigit(grid: CandidateGrid, cell: number, digit: number): void {
  grid.values[cell] = digit;
  grid.candidates[cell] = 0;
  for (const peer of PEERS[cell]!) grid.candidates[peer]! &= ~bit(digit);
}
