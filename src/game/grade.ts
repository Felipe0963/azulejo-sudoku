import { fromValues } from './candidates';
import type { Values } from './grid';
import { applyStep } from './techniques/apply-step';
import { hiddenPair } from './techniques/hidden-pair';
import { hiddenSingle } from './techniques/hidden-single';
import { lockedCandidates } from './techniques/locked-candidates';
import { nakedPair } from './techniques/naked-pair';
import { nakedSingle } from './techniques/naked-single';
import type { Technique } from './techniques/types';
import { xWing } from './techniques/x-wing';

export const LEVELS = ['easy', 'medium', 'hard', 'expert'] as const;
export type Level = (typeof LEVELS)[number];

/** Técnicas da mais simples para a mais difícil, com o nível que cada uma representa. */
const ORDER: readonly { technique: Technique; level: number }[] = [
  { technique: nakedSingle, level: 0 },
  { technique: hiddenSingle, level: 1 },
  { technique: lockedCandidates, level: 2 },
  { technique: nakedPair, level: 2 },
  { technique: hiddenPair, level: 3 },
  { technique: xWing, level: 3 },
];

/**
 * Resolve como uma pessoa: a cada passo, usa a técnica mais simples que faz progresso. O nível é o da
 * técnica mais difícil que foi necessária. Devolve null se as técnicas não resolvem o puzzle.
 */
export function grade(values: Values): Level | null {
  const grid = fromValues(values);
  let hardest = 0;
  for (;;) {
    if (grid.values.every((value) => value !== 0)) return LEVELS[hardest]!;
    if (grid.values.some((value, cell) => value === 0 && grid.candidates[cell] === 0)) return null;
    let progressed = false;
    for (const { technique, level } of ORDER) {
      const step = technique(grid);
      if (!step) continue;
      applyStep(grid, step);
      hardest = Math.max(hardest, level);
      progressed = true;
      break;
    }
    if (!progressed) return null;
  }
}

export const levelIndex = (level: Level): number => LEVELS.indexOf(level);
