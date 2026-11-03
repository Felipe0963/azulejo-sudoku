import data from '../data/puzzles.json' with { type: 'json' };
import type { Level } from './grade';
import { format, parse, type Values } from './grid';

const puzzles = data as Record<Level, readonly string[]> & { version: number };

export const bankSize = (level: Level): number => puzzles[level].length;

/** Puzzle do banco escolhido pela semente. */
export function pickPuzzle(level: Level, seed: number): number[] {
  const list = puzzles[level];
  return parse(list[Math.abs(Math.trunc(seed)) % list.length]!);
}

/** Uma semente que escolhe este puzzle do banco, ou null se ele não está no banco. */
export function seedOf(level: Level, puzzle: Values): number | null {
  const list = puzzles[level];
  const index = list.indexOf(format(puzzle));
  // Somar o tamanho do banco mantém a semente positiva (a URL não aceita 0) e aponta para o mesmo puzzle.
  return index === -1 ? null : index + list.length;
}
