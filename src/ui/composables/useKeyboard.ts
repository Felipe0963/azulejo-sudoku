import { cellAt, colOf, rowOf } from '../../game';

export interface KeyboardActions {
  select: (cell: number) => void;
  input: (digit: number) => void;
  erase: () => void;
  toggleNotes: () => void;
  undo: () => void;
  redo: () => void;
}

const MOVES: Record<string, readonly [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** Teclas do tabuleiro: setas, 1–9, Delete/Backspace, N, Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z e Ctrl+Y. */
export function useKeyboard(selected: () => number | null, actions: KeyboardActions) {
  return function onKeydown(event: KeyboardEvent) {
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) actions.redo();
      else actions.undo();
      return;
    }
    if (modifier && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      actions.redo();
      return;
    }
    const move = MOVES[event.key];
    if (move) {
      event.preventDefault();
      const cell = selected() ?? 0;
      const row = Math.min(8, Math.max(0, rowOf(cell) + move[0]));
      const col = Math.min(8, Math.max(0, colOf(cell) + move[1]));
      actions.select(cellAt(row, col));
      return;
    }
    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      actions.input(Number(event.key));
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      actions.erase();
      return;
    }
    if (event.key.toLowerCase() === 'n' && !modifier) {
      event.preventDefault();
      actions.toggleNotes();
    }
  };
}
