import { bit } from './candidates';
import type { Level } from './grade';
import { BOXES, PEERS, UNITS, boxOf, type Values } from './grid';
import { solve } from './solver';

/** A parte do estado que desfazer e refazer guardam. */
export interface Snapshot {
  readonly values: Values;
  /** Máscara de anotações de cada casa. */
  readonly notes: readonly number[];
  readonly glazed: readonly boolean[];
  readonly hints: number;
}

export interface GameState extends Snapshot {
  readonly level: Level;
  readonly puzzle: Values;
  readonly solution: Values;
  readonly past: readonly Snapshot[];
  readonly future: readonly Snapshot[];
  readonly won: boolean;
}

export type Action =
  | { readonly type: 'place'; readonly cell: number; readonly digit: number }
  | { readonly type: 'erase'; readonly cell: number }
  | { readonly type: 'toggleNote'; readonly cell: number; readonly digit: number }
  | { readonly type: 'hint'; readonly cell: number | null }
  | { readonly type: 'undo' }
  | { readonly type: 'redo' };

export type GameEvent =
  | { readonly type: 'placed'; readonly cell: number; readonly digit: number }
  | { readonly type: 'erased'; readonly cell: number }
  | { readonly type: 'noted'; readonly cell: number }
  | { readonly type: 'blocked'; readonly cell: number; readonly reason: 'given' | 'glazed' }
  | { readonly type: 'conflict'; readonly cells: readonly number[] }
  | { readonly type: 'glazed'; readonly box: number }
  | { readonly type: 'hinted'; readonly cell: number; readonly digit: number }
  | { readonly type: 'undone' }
  | { readonly type: 'redone' }
  | { readonly type: 'won' };

export interface Result {
  readonly state: GameState;
  readonly events: readonly GameEvent[];
}

const unchanged = (state: GameState): Result => ({ state, events: [] });

/** Painéis iguais à solução e se o tabuleiro inteiro já é a solução. */
export function progress(values: Values, solution: Values): { glazed: boolean[]; won: boolean } {
  return {
    glazed: BOXES.map((box) => box.every((cell) => values[cell] === solution[cell])),
    won: values.every((value, cell) => value === solution[cell]),
  };
}

export function newGame(level: Level, puzzle: Values): GameState {
  const solution = solve(puzzle);
  if (!solution) throw new Error('This puzzle has no solution.');
  return {
    level,
    puzzle: [...puzzle],
    solution,
    values: [...puzzle],
    notes: Array<number>(81).fill(0),
    glazed: progress(puzzle, solution).glazed,
    hints: 0,
    past: [],
    future: [],
    won: false,
  };
}

const snapshotOf = ({ values, notes, glazed, hints }: Snapshot): Snapshot => ({
  values,
  notes,
  glazed,
  hints,
});

function blockedReason(state: GameState, cell: number): 'given' | 'glazed' | null {
  if (state.puzzle[cell] !== 0) return 'given';
  if (state.glazed[boxOf(cell)]) return 'glazed';
  return null;
}

/** Casas que têm o mesmo número que `cell` em alguma unidade dela (incluindo `cell`), ou vazio. */
function conflictsAt(values: Values, cell: number): number[] {
  const digit = values[cell]!;
  const found = new Set<number>();
  for (const unit of UNITS) {
    if (!unit.includes(cell)) continue;
    for (const other of unit) if (other !== cell && values[other] === digit) found.add(other);
  }
  if (found.size === 0) return [];
  return [...found, cell].sort((a, b) => a - b);
}

/** Registra a jogada no histórico, aplica as mudanças e confere vitrificação e vitória. */
function commit(state: GameState, next: Snapshot, events: GameEvent[], touched: number | null): Result {
  const reached = progress(next.values, state.solution);
  let glazed = next.glazed;
  if (touched !== null) {
    const box = boxOf(touched);
    if (!glazed[box] && reached.glazed[box]) {
      glazed = glazed.map((value, index) => (index === box ? true : value));
      events.push({ type: 'glazed', box });
    }
  }
  const won = reached.won;
  if (won) events.push({ type: 'won' });
  return {
    state: { ...state, ...next, glazed, won, past: [...state.past, snapshotOf(state)], future: [] },
    events,
  };
}

function placeDigit(state: GameState, cell: number, digit: number, extra: GameEvent[] = []): Result {
  const values = state.values.map((value, index) => (index === cell ? digit : value));
  const peers = new Set(PEERS[cell]);
  const notes = state.notes.map((mask, index) =>
    index === cell ? 0 : peers.has(index) ? mask & ~bit(digit) : mask,
  );
  const events: GameEvent[] = [...extra, { type: 'placed', cell, digit }];
  const conflicting = conflictsAt(values, cell);
  if (conflicting.length > 0) events.push({ type: 'conflict', cells: conflicting });
  return commit(state, { ...snapshotOf(state), values, notes }, events, cell);
}

function hintTarget(state: GameState, cell: number | null): number | null {
  if (cell !== null && blockedReason(state, cell) === null && state.values[cell] !== state.solution[cell])
    return cell;
  const index = state.values.findIndex(
    (value, i) => value !== state.solution[i] && blockedReason(state, i) === null,
  );
  return index === -1 ? null : index;
}

/** Aplica uma ação. Devolve o novo estado e os eventos; uma ação sem efeito devolve o mesmo estado. */
export function apply(state: GameState, action: Action): Result {
  if (state.won) return unchanged(state);

  switch (action.type) {
    case 'place': {
      const reason = blockedReason(state, action.cell);
      if (reason) return { state, events: [{ type: 'blocked', cell: action.cell, reason }] };
      if (state.values[action.cell] === action.digit) return unchanged(state);
      return placeDigit(state, action.cell, action.digit);
    }
    case 'erase': {
      const reason = blockedReason(state, action.cell);
      if (reason) return { state, events: [{ type: 'blocked', cell: action.cell, reason }] };
      if (state.values[action.cell] !== 0) {
        const values = state.values.map((value, index) => (index === action.cell ? 0 : value));
        return commit(state, { ...snapshotOf(state), values }, [{ type: 'erased', cell: action.cell }], null);
      }
      if (state.notes[action.cell] !== 0) {
        const notes = state.notes.map((mask, index) => (index === action.cell ? 0 : mask));
        return commit(state, { ...snapshotOf(state), notes }, [{ type: 'erased', cell: action.cell }], null);
      }
      return unchanged(state);
    }
    case 'toggleNote': {
      const reason = blockedReason(state, action.cell);
      if (reason) return { state, events: [{ type: 'blocked', cell: action.cell, reason }] };
      if (state.values[action.cell] !== 0) return unchanged(state);
      const notes = state.notes.map((mask, index) =>
        index === action.cell ? mask ^ bit(action.digit) : mask,
      );
      return commit(state, { ...snapshotOf(state), notes }, [{ type: 'noted', cell: action.cell }], null);
    }
    case 'hint': {
      const cell = hintTarget(state, action.cell);
      if (cell === null) return unchanged(state);
      const digit = state.solution[cell]!;
      const result = placeDigit(state, cell, digit, [{ type: 'hinted', cell, digit }]);
      return { ...result, state: { ...result.state, hints: state.hints + 1 } };
    }
    case 'undo': {
      const previous = state.past.at(-1);
      if (!previous) return unchanged(state);
      return {
        state: {
          ...state,
          ...previous,
          past: state.past.slice(0, -1),
          future: [...state.future, snapshotOf(state)],
        },
        events: [{ type: 'undone' }],
      };
    }
    case 'redo': {
      const next = state.future.at(-1);
      if (!next) return unchanged(state);
      return {
        state: {
          ...state,
          ...next,
          past: [...state.past, snapshotOf(state)],
          future: state.future.slice(0, -1),
        },
        events: [{ type: 'redone' }],
      };
    }
  }
}
