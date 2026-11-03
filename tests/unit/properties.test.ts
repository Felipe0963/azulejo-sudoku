import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BOXES, boxOf } from '../../src/game/grid';
import { apply, newGame, type Action, type GameState } from '../../src/game/game';
import { CLASSIC, CLASSIC_SOLUTION } from './fixtures';

const RUNS = 200;
const cell = fc.integer({ min: 0, max: 80 });
const digit = fc.integer({ min: 1, max: 9 });
const emptyCells = CLASSIC.flatMap((value, index) => (value === 0 ? [index] : []));

/**
 * Ações viciadas para a partida andar: 75% colocam o número da solução numa casa vazia do puzzle, e o resto
 * mistura números quaisquer, apagar, anotar, dica, desfazer e refazer. Sem o vício, quase nenhuma sequência
 * vitrificava um painel, e nenhuma vencia.
 */
const action: fc.Arbitrary<Action> = fc.oneof(
  {
    weight: 75,
    arbitrary: fc
      .constantFrom(...emptyCells)
      .map((index) => ({ type: 'place' as const, cell: index, digit: CLASSIC_SOLUTION[index]! })),
  },
  { weight: 5, arbitrary: fc.record({ type: fc.constant('place' as const), cell, digit }) },
  { weight: 5, arbitrary: fc.record({ type: fc.constant('erase' as const), cell }) },
  { weight: 5, arbitrary: fc.record({ type: fc.constant('toggleNote' as const), cell, digit }) },
  {
    weight: 2,
    arbitrary: fc.record({ type: fc.constant('hint' as const), cell: fc.option(cell, { nil: null }) }),
  },
  { weight: 4, arbitrary: fc.constant({ type: 'undo' } as const) },
  { weight: 4, arbitrary: fc.constant({ type: 'redo' } as const) },
);
// `size: 'max'` deixa o fast-check gerar sequências até o tamanho máximo; o padrão quase não passa de 30.
const actions = fc.array(action, { minLength: 50, maxLength: 400, size: 'max' });

const play = (list: readonly Action[]): GameState[] => {
  const states = [newGame('easy', CLASSIC)];
  for (const a of list) states.push(apply(states.at(-1)!, a).state);
  return states;
};

/**
 * Roda a propriedade e confere que as sequências exercitaram de verdade a vitrificação e a vitória:
 * mais da metade das execuções vitrifica pelo menos um painel, e pelo menos 5% vencem.
 */
function checkProperty(predicate: (states: GameState[]) => void) {
  let glazedRuns = 0;
  let wonRuns = 0;
  fc.assert(
    fc.property(actions, (list) => {
      const states = play(list);
      if (states.some((state) => state.glazed.some(Boolean))) glazedRuns++;
      if (states.at(-1)!.won) wonRuns++;
      predicate(states);
    }),
    { numRuns: RUNS },
  );
  expect(glazedRuns).toBeGreaterThan(RUNS / 2);
  expect(wonRuns).toBeGreaterThanOrEqual(RUNS * 0.05);
}

// Cada propriedade junta as falhas numa lista e faz um só `expect` por execução: milhões de `expect` deixariam o teste lento.
describe('propriedades do jogo', () => {
  it('os números do puzzle nunca mudam', () => {
    checkProperty((states) => {
      const changed = states.flatMap((state, step) =>
        CLASSIC.flatMap((value, index) =>
          value !== 0 && state.values[index] !== value ? [{ step, index }] : [],
        ),
      );
      expect(changed).toEqual([]);
    });
  });

  it('um painel só fica vitrificado quando é igual à solução', () => {
    checkProperty((states) => {
      const wrong = states.flatMap((state, step) =>
        BOXES.flatMap((box, b) =>
          state.glazed[b] && box.some((c) => state.values[c] !== state.solution[c]) ? [{ step, box: b }] : [],
        ),
      );
      expect(wrong).toEqual([]);
    });
  });

  it('um painel vitrificado nunca deixa de estar vitrificado e suas casas nunca mudam', () => {
    checkProperty((states) => {
      const broken = states.slice(1).flatMap((state, index) => {
        const before = states[index]!;
        return BOXES.flatMap((box, b) =>
          before.glazed[b] && (!state.glazed[b] || box.some((c) => state.values[c] !== before.values[c]))
            ? [{ step: index + 1, box: b }]
            : [],
        );
      });
      expect(broken).toEqual([]);
    });
  });

  it('desfazer tudo volta ao começo fora dos painéis vitrificados; refazer o mesmo número de vezes volta ao fim', () => {
    checkProperty((states) => {
      const last = states.at(-1)!;
      if (last.won) return;
      let current = last;
      while (current.past.length > 0) current = apply(current, { type: 'undo' }).state;
      // A vitrificação é permanente: as casas dos painéis vitrificados ficam como no fim; o resto volta ao começo.
      const origin = (index: number) => (last.glazed[boxOf(index)] ? last : states[0]!);
      expect(current.values).toEqual(current.values.map((_, index) => origin(index).values[index]));
      expect(current.notes).toEqual(current.notes.map((_, index) => origin(index).notes[index]));
      expect(current.glazed).toEqual(last.glazed);
      // As dicas ficam fora do histórico: desfazer não devolve dica usada.
      expect(current.hints).toBe(last.hints);
      // Se a sequência terminou com desfazer, `last` ainda tem jogadas a refazer; refazer só as desfeitas volta a `last`.
      for (let step = 0; step < last.past.length; step++) current = apply(current, { type: 'redo' }).state;
      expect(current.future).toHaveLength(last.future.length);
      expect(current.values).toEqual(last.values);
      expect(current.notes).toEqual(last.notes);
      expect(current.glazed).toEqual(last.glazed);
      expect(current.hints).toBe(last.hints);
    });
  });

  it('vence exatamente quando o tabuleiro é igual à solução', () => {
    checkProperty((states) => {
      const mismatched = states.flatMap((state, step) =>
        state.won !== state.values.every((value, index) => value === state.solution[index]) ? [step] : [],
      );
      expect(mismatched).toEqual([]);
    });
  });
});
