import { newGame, progress, type GameState } from './game';
import { LEVELS, type Level } from './grade';
import { format, parse } from './grid';
import { countSolutions } from './solver';

const VERSION = 1;

export interface Saved {
  readonly state: GameState;
  readonly elapsedMs: number;
}

interface Stored {
  version: number;
  level: Level;
  puzzle: string;
  values: string;
  notes: number[];
  hints: number;
  elapsedMs: number;
}

export function serialize(state: GameState, elapsedMs: number): string {
  const stored: Stored = {
    version: VERSION,
    level: state.level,
    puzzle: format(state.puzzle),
    values: format(state.values),
    notes: [...state.notes],
    hints: state.hints,
    elapsedMs: Math.max(0, Math.round(elapsedMs)),
  };
  return JSON.stringify(stored);
}

const isStored = (value: unknown): value is Stored => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === VERSION &&
    typeof v.level === 'string' &&
    (LEVELS as readonly string[]).includes(v.level) &&
    typeof v.puzzle === 'string' &&
    typeof v.values === 'string' &&
    Array.isArray(v.notes) &&
    v.notes.length === 81 &&
    v.notes.every((mask) => Number.isInteger(mask) && mask >= 0 && mask <= 0x1ff) &&
    Number.isInteger(v.hints) &&
    (v.hints as number) >= 0 &&
    typeof v.elapsedMs === 'number' &&
    Number.isFinite(v.elapsedMs) &&
    v.elapsedMs >= 0
  );
};

/**
 * Restaura uma partida salva. Devolve null para qualquer coisa inválida ou de outra versão: puzzle sem solução
 * única, número do puzzle alterado, anotação em casa preenchida, partida já vencida, tempo ou dicas impossíveis.
 */
export function deserialize(text: string): Saved | null {
  try {
    const raw: unknown = JSON.parse(text);
    if (!isStored(raw)) return null;
    const puzzle = parse(raw.puzzle);
    const values = parse(raw.values);
    if (puzzle.some((value, cell) => value !== 0 && values[cell] !== value)) return null;
    if (raw.notes.some((mask, cell) => mask !== 0 && values[cell] !== 0)) return null;
    if (countSolutions(puzzle) !== 1) return null;
    const fresh = newGame(raw.level, puzzle);
    const { glazed, won } = progress(values, fresh.solution);
    if (won) return null;
    return {
      state: { ...fresh, values, notes: raw.notes, hints: raw.hints, glazed, won },
      elapsedMs: raw.elapsedMs,
    };
  } catch {
    return null;
  }
}
