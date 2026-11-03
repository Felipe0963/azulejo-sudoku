import { describe, expect, it } from 'vitest';
import { apply, newGame } from '../../src/game/game';
import { deserialize, serialize } from '../../src/game/serialize';
import { CLASSIC } from './fixtures';

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

  it('recusa uma partida em que um número do puzzle foi alterado', () => {
    const saved = JSON.parse(serialize(played(), 0)) as { values: string };
    saved.values = `9${saved.values.slice(1)}`;
    expect(deserialize(JSON.stringify(saved))).toBeNull();
  });
});
