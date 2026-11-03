import { digits, has } from '../candidates';
import { UNITS } from '../grid';
import type { Placement, Technique } from './types';

/** Dois números que, numa unidade, só cabem nas mesmas duas casas: os outros candidatos dessas casas saem. */
export const hiddenPair: Technique = (grid) => {
  for (const unit of UNITS) {
    const spots = (digit: number) =>
      unit.filter((cell) => grid.values[cell] === 0 && has(grid.candidates[cell]!, digit));
    for (let a = 1; a <= 9; a++) {
      const first = spots(a);
      if (first.length !== 2) continue;
      for (let b = a + 1; b <= 9; b++) {
        const second = spots(b);
        if (second.length !== 2 || second[0] !== first[0] || second[1] !== first[1]) continue;
        const eliminate: Placement[] = first.flatMap((cell) =>
          digits(grid.candidates[cell]!)
            .filter((digit) => digit !== a && digit !== b)
            .map((digit) => ({ cell, digit })),
        );
        if (eliminate.length > 0) return { technique: 'hiddenPair', eliminate };
      }
    }
  }
  return null;
};
