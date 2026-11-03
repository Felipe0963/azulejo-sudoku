import { colOf, rowOf, type GameEvent, type Level } from '../../game';

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const position = (cell: number) => `Row ${String(rowOf(cell) + 1)}, column ${String(colOf(cell) + 1)}`;

export interface CellDescription {
  cell: number;
  value: number;
  given: boolean;
  notes: readonly number[];
  conflict: boolean;
  glazed: boolean;
}

export const copy = {
  title: 'Azulejo',
  subtitle: 'Sudoku, glazed one panel at a time.',
  chooseLevel: 'Choose a level',
  levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' } satisfies Record<Level, string>,
  continue: 'Continue',
  continueDetail: (level: Level, ms: number) => `${copy.levels[level]} · ${formatTime(ms)}`,
  replaceWarning: 'Starting a new game replaces the one in progress.',
  time: 'Time',
  undo: 'Undo',
  redo: 'Redo',
  erase: 'Erase',
  notes: 'Notes',
  notesOn: 'Notes on',
  notesOff: 'Notes off',
  hint: 'Hint',
  pause: 'Pause',
  paused: 'Paused',
  resume: 'Resume',
  boardLabel: 'Sudoku board',
  placeLabel: (digit: number, left: number) => `Place ${String(digit)}, ${String(left)} left`,
  cellLabel: ({ cell, value, given, notes, conflict, glazed }: CellDescription) => {
    const content =
      value !== 0
        ? `${String(value)}${given ? ', given' : ''}`
        : notes.length > 0
          ? `notes ${notes.join(', ')}`
          : 'empty';
    return `${position(cell)}, ${content}${conflict ? ', conflict' : ''}${glazed ? ', glazed' : ''}`;
  },
  glazedPanel: (box: number) => `Panel ${String(box + 1)} glazed.`,
  conflict: 'Conflict.',
  givenBlocked: 'This number is part of the puzzle.',
  glazedBlocked: 'This panel is glazed.',
  hinted: (cell: number, digit: number) =>
    `Hint: row ${String(rowOf(cell) + 1)}, column ${String(colOf(cell) + 1)} is ${String(digit)}.`,
  won: 'The mural is complete.',
  level: 'Level',
  hints: 'Hints',
  bestTime: 'Best time',
  newBestTime: 'New best time',
  playAgain: 'Play again',
  changeLevel: 'Change level',
} as const;

/**
 * O que a região aria-live da página anuncia depois de uma ação, em ordem. Na vitória, nada: a tela de vitória é
 * um diálogo modal (o resto da página fica inerte) e anuncia `copy.won` na sua própria região de status.
 */
export function announcementFor(events: readonly GameEvent[]): string {
  if (events.some((event) => event.type === 'won')) return '';
  const parts: string[] = [];
  for (const event of events) {
    if (event.type === 'hinted') parts.push(copy.hinted(event.cell, event.digit));
    if (event.type === 'conflict') parts.push(copy.conflict);
    if (event.type === 'glazed') parts.push(copy.glazedPanel(event.box));
    if (event.type === 'blocked')
      parts.push(event.reason === 'given' ? copy.givenBlocked : copy.glazedBlocked);
  }
  return parts.join(' ');
}
