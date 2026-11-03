import { has } from '../candidates';
import { COLS, ROWS } from '../grid';
import type { Placement, Technique } from './types';

/**
 * Se um número, em duas linhas, só cabe nas mesmas duas colunas, ele sai dessas colunas nas outras linhas.
 * O mesmo vale trocando linhas por colunas.
 */
export const xWing: Technique = (grid) => {
  const orientations = [
    { lines: ROWS, crosses: COLS },
    { lines: COLS, crosses: ROWS },
  ];
  for (let digit = 1; digit <= 9; digit++) {
    for (const { lines, crosses } of orientations) {
      const positions = lines.map((line) =>
        line.flatMap((cell, index) =>
          grid.values[cell] === 0 && has(grid.candidates[cell]!, digit) ? [index] : [],
        ),
      );
      for (let i = 0; i < 9; i++) {
        if (positions[i]!.length !== 2) continue;
        for (let j = i + 1; j < 9; j++) {
          const [a, b] = positions[i]!;
          if (positions[j]!.length !== 2 || positions[j]![0] !== a || positions[j]![1] !== b) continue;
          const base = new Set([...lines[i]!, ...lines[j]!]);
          const eliminate: Placement[] = [crosses[a!]!, crosses[b!]!]
            .flat()
            .filter(
              (cell) => !base.has(cell) && grid.values[cell] === 0 && has(grid.candidates[cell]!, digit),
            )
            .map((cell) => ({ cell, digit }));
          if (eliminate.length > 0) return { technique: 'xWing', eliminate };
        }
      }
    }
  }
  return null;
};
