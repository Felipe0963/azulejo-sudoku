export const SIZE = 9;
export const CELLS = 81;

/** 81 números, em ordem de leitura; 0 é casa vazia. */
export type Values = readonly number[];

export const rowOf = (cell: number): number => Math.floor(cell / SIZE);
export const colOf = (cell: number): number => cell % SIZE;
export const boxOf = (cell: number): number => Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);
export const cellAt = (row: number, col: number): number => row * SIZE + col;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export const ROWS: readonly (readonly number[])[] = range(SIZE).map((r) =>
  range(SIZE).map((c) => cellAt(r, c)),
);
export const COLS: readonly (readonly number[])[] = range(SIZE).map((c) =>
  range(SIZE).map((r) => cellAt(r, c)),
);
export const BOXES: readonly (readonly number[])[] = range(SIZE).map((b) =>
  range(SIZE).map((i) => cellAt(Math.floor(b / 3) * 3 + Math.floor(i / 3), (b % 3) * 3 + (i % 3))),
);
export const UNITS: readonly (readonly number[])[] = [...ROWS, ...COLS, ...BOXES];

/** As 20 casas que compartilham linha, coluna ou bloco com cada casa. */
export const PEERS: readonly (readonly number[])[] = range(CELLS).map((cell) => {
  const peers = new Set([...ROWS[rowOf(cell)]!, ...COLS[colOf(cell)]!, ...BOXES[boxOf(cell)]!]);
  peers.delete(cell);
  return [...peers].sort((a, b) => a - b);
});

/** Lê 81 caracteres: dígitos de 1 a 9, e `.` ou `0` para casa vazia. */
export function parse(text: string): number[] {
  if (text.length !== CELLS) throw new Error(`A puzzle needs ${String(CELLS)} characters.`);
  return Array.from(text, (char) => {
    if (char === '.' || char === '0') return 0;
    const digit = Number(char);
    if (!Number.isInteger(digit) || digit < 1 || digit > 9) throw new Error(`Invalid character "${char}".`);
    return digit;
  });
}

export const format = (values: Values): string => values.map((v) => (v === 0 ? '.' : String(v))).join('');
