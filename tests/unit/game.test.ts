import { describe, expect, it } from 'vitest';
import { bit } from '../../src/game/candidates';
import { apply, newGame, type GameState } from '../../src/game/game';
import { CLASSIC, CLASSIC_SOLUTION } from './fixtures';

const start = () => newGame('easy', CLASSIC);
const run = (state: GameState, ...actions: Parameters<typeof apply>[1][]) =>
  actions.reduce((current, action) => apply(current, action).state, state);
const emptyCells = CLASSIC.flatMap((value, cell) => (value === 0 ? [cell] : []));

describe('newGame', () => {
  it('começa com os números do puzzle, sem anotações, painéis ou dicas', () => {
    const state = start();
    expect(state.values).toEqual(CLASSIC);
    expect(state.solution).toEqual(CLASSIC_SOLUTION);
    expect(state.glazed.every((g) => !g)).toBe(true);
    expect(state).toMatchObject({ hints: 0, won: false, past: [], future: [] });
  });
});

describe('place e erase', () => {
  it('número do puzzle não muda e a ação é bloqueada', () => {
    const state = start();
    const result = apply(state, { type: 'place', cell: 0, digit: 9 });
    expect(result.state).toBe(state);
    expect(result.events).toEqual([{ type: 'blocked', cell: 0, reason: 'given' }]);
  });

  it('coloca um número e guarda o histórico', () => {
    const result = apply(start(), { type: 'place', cell: 2, digit: 4 });
    expect(result.state.values[2]).toBe(4);
    expect(result.state.past).toHaveLength(1);
    expect(result.events[0]).toEqual({ type: 'placed', cell: 2, digit: 4 });
  });

  it('conflito gera evento com as casas envolvidas', () => {
    const result = apply(start(), { type: 'place', cell: 2, digit: 5 });
    expect(result.events).toContainEqual({ type: 'conflict', cells: [0, 2] });
  });

  it('colocar tira o número das anotações dos vizinhos', () => {
    const noted = run(
      start(),
      { type: 'toggleNote', cell: 3, digit: 4 },
      { type: 'place', cell: 2, digit: 4 },
    );
    expect(noted.notes[3]! & bit(4)).toBe(0);
  });

  it('apagar tira o número; apagar casa vazia sem anotações não faz nada', () => {
    const placed = run(start(), { type: 'place', cell: 2, digit: 4 });
    expect(apply(placed, { type: 'erase', cell: 2 }).state.values[2]).toBe(0);
    const empty = start();
    expect(apply(empty, { type: 'erase', cell: 2 }).state).toBe(empty);
  });

  it('repetir o mesmo número não faz nada', () => {
    const placed = run(start(), { type: 'place', cell: 2, digit: 4 });
    expect(apply(placed, { type: 'place', cell: 2, digit: 4 }).state).toBe(placed);
  });
});

describe('anotações', () => {
  it('liga e desliga um candidato numa casa vazia', () => {
    const on = run(start(), { type: 'toggleNote', cell: 2, digit: 1 });
    expect(on.notes[2]).toBe(bit(1));
    expect(run(on, { type: 'toggleNote', cell: 2, digit: 1 }).notes[2]).toBe(0);
  });

  it('não anota em casa preenchida', () => {
    const state = start();
    expect(apply(state, { type: 'toggleNote', cell: 0, digit: 1 }).state).toBe(state);
  });
});

describe('vitrificação e vitória', () => {
  it('bloco completo e certo é vitrificado e trancado', () => {
    const glazed = run(
      start(),
      { type: 'place', cell: 2, digit: 4 },
      { type: 'place', cell: 10, digit: 7 },
      { type: 'place', cell: 11, digit: 2 },
    );
    const result = apply(glazed, { type: 'place', cell: 18, digit: 1 });
    expect(result.events).toContainEqual({ type: 'glazed', box: 0 });
    expect(result.state.glazed[0]).toBe(true);
    expect(apply(result.state, { type: 'erase', cell: 2 }).events).toEqual([
      { type: 'blocked', cell: 2, reason: 'glazed' },
    ]);
  });

  it('bloco completo mas errado não é vitrificado', () => {
    const wrong = run(
      start(),
      { type: 'place', cell: 2, digit: 7 },
      { type: 'place', cell: 10, digit: 4 },
      { type: 'place', cell: 11, digit: 2 },
      { type: 'place', cell: 18, digit: 1 },
    );
    expect(wrong.glazed[0]).toBe(false);
  });

  it('preencher tudo certo vence, e depois disso nada muda', () => {
    const won = emptyCells.reduce(
      (state, cell) => apply(state, { type: 'place', cell, digit: CLASSIC_SOLUTION[cell]! }).state,
      start(),
    );
    expect(won.won).toBe(true);
    expect(won.glazed.every(Boolean)).toBe(true);
    expect(apply(won, { type: 'undo' }).state).toBe(won);
  });
});

describe('dica', () => {
  it('sem casa, revela a primeira casa diferente da solução', () => {
    const result = apply(start(), { type: 'hint', cell: null });
    expect(result.state.values[2]).toBe(4);
    expect(result.state.hints).toBe(1);
    expect(result.events).toContainEqual({ type: 'hinted', cell: 2, digit: 4 });
  });

  it('desfazer uma dica tira o número, mas a dica continua contada', () => {
    const hinted = run(start(), { type: 'hint', cell: null });
    const undone = apply(hinted, { type: 'undo' }).state;
    expect(undone.values[2]).toBe(0);
    expect(undone.hints).toBe(1);
    expect(apply(undone, { type: 'redo' }).state.hints).toBe(1);
  });

  it('com casa errada selecionada, corrige essa casa', () => {
    const wrong = run(start(), { type: 'place', cell: 10, digit: 1 });
    expect(apply(wrong, { type: 'hint', cell: 10 }).state.values[10]).toBe(7);
  });
});

describe('desfazer e refazer', () => {
  it('desfaz e refaz uma jogada', () => {
    const placed = run(start(), { type: 'place', cell: 2, digit: 4 });
    const undone = apply(placed, { type: 'undo' }).state;
    expect(undone.values[2]).toBe(0);
    expect(undone.future).toHaveLength(1);
    expect(apply(undone, { type: 'redo' }).state.values[2]).toBe(4);
  });

  it('sem histórico, não faz nada', () => {
    const state = start();
    expect(apply(state, { type: 'undo' }).state).toBe(state);
    expect(apply(state, { type: 'redo' }).state).toBe(state);
  });

  it('uma jogada nova apaga o refazer', () => {
    const undone = run(start(), { type: 'place', cell: 2, digit: 4 }, { type: 'undo' });
    expect(run(undone, { type: 'place', cell: 2, digit: 1 }).future).toHaveLength(0);
  });
});
