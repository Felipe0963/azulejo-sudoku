import { UNITS, type Values } from './grid';

/** Casas cujo número se repete em alguma linha, coluna ou bloco. */
export function conflicts(values: Values): Set<number> {
  const result = new Set<number>();
  for (const unit of UNITS) {
    const seen = new Map<number, number>();
    for (const cell of unit) {
      const value = values[cell]!;
      if (value === 0) continue;
      const first = seen.get(value);
      if (first === undefined) {
        seen.set(value, cell);
      } else {
        result.add(first);
        result.add(cell);
      }
    }
  }
  return result;
}

export const isComplete = (values: Values): boolean => values.every((value) => value !== 0);

export const isSolved = (values: Values): boolean => isComplete(values) && conflicts(values).size === 0;
