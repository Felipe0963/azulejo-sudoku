import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BOXES } from '../../src/game/grid';
import { apply, newGame, type Action, type GameState } from '../../src/game/game';
import { CLASSIC } from './fixtures';

const cell = fc.integer({ min: 0, max: 80 });
const digit = fc.integer({ min: 1, max: 9 });
const action: fc.Arbitrary<Action> = fc.oneof(
  fc.record({ type: fc.constant('place' as const), cell, digit }),
  fc.record({ type: fc.constant('erase' as const), cell }),
  fc.record({ type: fc.constant('toggleNote' as const), cell, digit }),
  fc.record({ type: fc.constant('hint' as const), cell: fc.option(cell, { nil: null }) }),
  fc.constant({ type: 'undo' } as const),
  fc.constant({ type: 'redo' } as const),
);
const actions = fc.array(action, { minLength: 20, maxLength: 150 });

const play = (list: readonly Action[]): GameState[] => {
  const states = [newGame('easy', CLASSIC)];
  for (const a of list) states.push(apply(states.at(-1)!, a).state);
  return states;
};

describe('propriedades do jogo', () => {
  it('os números do puzzle nunca mudam', () => {
    fc.assert(
      fc.property(actions, (list) => {
        for (const state of play(list)) {
          CLASSIC.forEach((value, index) => {
            if (value !== 0) expect(state.values[index]).toBe(value);
          });
        }
      }),
      { numRuns: 200 },
    );
  });

  it('um painel só fica vitrificado quando é igual à solução', () => {
    fc.assert(
      fc.property(actions, (list) => {
        for (const state of play(list)) {
          BOXES.forEach((box, index) => {
            if (state.glazed[index]) for (const c of box) expect(state.values[c]).toBe(state.solution[c]);
          });
        }
      }),
      { numRuns: 200 },
    );
  });

  it('desfazer tudo volta ao começo; refazer o mesmo número de vezes volta ao ponto de partida', () => {
    fc.assert(
      fc.property(actions, (list) => {
        const states = play(list);
        const last = states.at(-1)!;
        if (last.won) return;
        let current = last;
        while (current.past.length > 0) current = apply(current, { type: 'undo' }).state;
        expect(current.values).toEqual(states[0]!.values);
        expect(current.notes).toEqual(states[0]!.notes);
        expect(current.hints).toBe(0);
        // Se a sequência terminou com desfazer, `last` ainda tem jogadas a refazer; refazer só as desfeitas volta a `last`.
        for (let step = 0; step < last.past.length; step++) current = apply(current, { type: 'redo' }).state;
        expect(current.future).toHaveLength(last.future.length);
        expect(current.values).toEqual(last.values);
        expect(current.notes).toEqual(last.notes);
        expect(current.glazed).toEqual(last.glazed);
        expect(current.hints).toBe(last.hints);
      }),
      { numRuns: 200 },
    );
  });

  it('vence exatamente quando o tabuleiro é igual à solução', () => {
    fc.assert(
      fc.property(actions, (list) => {
        for (const state of play(list)) {
          expect(state.won).toBe(state.values.every((value, index) => value === state.solution[index]));
        }
      }),
      { numRuns: 200 },
    );
  });
});
