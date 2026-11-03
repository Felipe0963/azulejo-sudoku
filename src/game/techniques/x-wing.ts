import { COLS, ROWS } from '../grid';
import { spotsOf } from './spots';
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
      const positions = lines.map((line) => spotsOf(grid, line, digit).map((cell) => line.indexOf(cell)));
      for (let i = 0; i < 9; i++) {
        if (positions[i]!.length !== 2) continue;
        for (let j = i + 1; j < 9; j++) {
          const [a, b] = positions[i]!;
          if (positions[j]!.length !== 2 || positions[j]![0] !== a || positions[j]![1] !== b) continue;
          const base = new Set([...lines[i]!, ...lines[j]!]);
          const eliminate: Placement[] = spotsOf(grid, [crosses[a!]!, crosses[b!]!].flat(), digit)
            .filter((cell) => !base.has(cell))
            .map((cell) => ({ cell, digit }));
          if (eliminate.length > 0) return { technique: 'xWing', eliminate };
        }
      }
    }
  }
  return null;
};
