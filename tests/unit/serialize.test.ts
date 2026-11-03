import { describe, expect, it } from 'vitest';
import { apply, newGame } from '../../src/game/game';
import { deserialize, serialize } from '../../src/game/serialize';
import { format } from '../../src/game/grid';
import { CLASSIC, CLASSIC_SOLUTION } from './fixtures';

const played = () => {
  let state = newGame('hard', CLASSIC);
  state = apply(state, { type: 'place', cell: 2, digit: 4 }).state;
  state = apply(state, { type: 'toggleNote', cell: 3, digit: 6 }).state;
  state = apply(state, { type: 'hint', cell: null }).state;
  return state;
};

describe('serialize', () => {
  it('salvar e restaurar mantém o tabuleiro, as anotações, os painéis, as dicas e o tempo', () => {
    const state = played();
    const restored = deserialize(serialize(state, 61_000))!;
    expect(restored.elapsedMs).toBe(61_000);
    expect(restored.state).toMatchObject({
      level: 'hard',
      values: state.values,
      notes: state.notes,
      glazed: state.glazed,
      hints: state.hints,
      past: [],
      future: [],
    });
  });

  it.each([
    ['texto que não é JSON', 'not json'],
    ['versão diferente', JSON.stringify({ version: 99 })],
    ['objeto incompleto', JSON.stringify({ version: 1, level: 'easy' })],
  ])('recusa %s', (_, text) => {
    expect(deserialize(text)).toBeNull();
  });

  type Stored = { puzzle: string; values: string; notes: number[]; hints: number; elapsedMs: number };
  const edited = (change: (saved: Stored) => void): string => {
    const saved = JSON.parse(serialize(played(), 1000)) as Stored;
    change(saved);
    return JSON.stringify(saved);
  };

  it.each([
    [
      'tempo negativo',
      edited((saved) => {
        saved.elapsedMs = -5000;
      }),
    ],
    // JSON não escreve Infinity, mas lê 1e999 como Infinity.
    ['tempo infinito', edited(() => undefined).replace('"elapsedMs":1000', '"elapsedMs":1e999')],
    [
      'dicas negativas',
      edited((saved) => {
        saved.hints = -1;
      }),
    ],
    [
      'puzzle sem solução única',
      edited((saved) => {
        saved.puzzle = '.'.repeat(81);
        saved.values = '.'.repeat(81);
        saved.notes = Array<number>(81).fill(0);
      }),
    ],
    [
      'anotações numa casa do puzzle',
      edited((saved) => {
        saved.notes[0] = 1;
      }),
    ],
    [
      'anotações numa casa preenchida pelo jogador',
      edited((saved) => {
        saved.notes[2] = 1;
      }),
    ],
    [
      'partida já vencida',
      edited((saved) => {
        saved.values = format(CLASSIC_SOLUTION);
        saved.notes = Array<number>(81).fill(0);
      }),
    ],
  ])('recusa %s', (_, text) => {
    // O texto continua sendo JSON válido: a recusa vem da validação, não da leitura.
    expect(() => JSON.parse(text) as unknown).not.toThrow();
    expect(deserialize(text)).toBeNull();
  });

  it('recusa uma partida em que um número do puzzle foi alterado', () => {
    const saved = JSON.parse(serialize(played(), 0)) as { values: string };
    saved.values = `9${saved.values.slice(1)}`;
    expect(deserialize(JSON.stringify(saved))).toBeNull();
  });
});
