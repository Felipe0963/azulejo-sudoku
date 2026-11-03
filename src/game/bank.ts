import data from '../data/puzzles.json';
import type { Level } from './grade';
import { parse } from './grid';

const puzzles = data as Record<Level, readonly string[]> & { version: number };

export const bankSize = (level: Level): number => puzzles[level].length;

/** Puzzle do banco escolhido pela semente. */
export function pickPuzzle(level: Level, seed: number): number[] {
  const list = puzzles[level];
  return parse(list[Math.abs(Math.trunc(seed)) % list.length]!);
}
