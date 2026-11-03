import { describe, expect, it } from 'vitest';
import { ALL, bit, type CandidateGrid } from '../../src/game/candidates';
import { COLS, ROWS } from '../../src/game/grid';
import { applyStep } from '../../src/game/techniques/apply-step';
import { hiddenPair } from '../../src/game/techniques/hidden-pair';
import { hiddenSingle } from '../../src/game/techniques/hidden-single';
import { lockedCandidates } from '../../src/game/techniques/locked-candidates';
import { nakedPair } from '../../src/game/techniques/naked-pair';
import { nakedSingle } from '../../src/game/techniques/naked-single';
import { xWing } from '../../src/game/techniques/x-wing';

/** Grade vazia com todos os candidatos em todas as casas. */
const open = (): CandidateGrid => ({
  values: Array<number>(81).fill(0),
  candidates: Array<number>(81).fill(ALL),
});
const without = (digit: number) => ALL & ~bit(digit);
const eliminated = (step: ReturnType<typeof nakedPair>) =>
  (step?.eliminate ?? []).map((e) => `${String(e.cell)}:${String(e.digit)}`).sort();

describe('nakedSingle', () => {
  it('coloca o único candidato de uma casa', () => {
    const grid = open();
    grid.candidates[40] = bit(5);
    expect(nakedSingle(grid)).toEqual({
      technique: 'nakedSingle',
      place: { cell: 40, digit: 5 },
      eliminate: [],
    });
  });

  it('não acha nada quando toda casa tem vários candidatos', () => {
    expect(nakedSingle(open())).toBeNull();
  });
});

describe('hiddenSingle', () => {
  it('coloca o número que só cabe numa casa da linha', () => {
    const grid = open();
    for (const cell of ROWS[0]!) grid.candidates[cell] = without(7);
    grid.candidates[3] = ALL;
    expect(hiddenSingle(grid)).toEqual({
      technique: 'hiddenSingle',
      place: { cell: 3, digit: 7 },
      eliminate: [],
    });
  });

  it('não acha nada quando todo número cabe em várias casas de cada unidade', () => {
    expect(hiddenSingle(open())).toBeNull();
  });
});

describe('lockedCandidates', () => {
  it('não acha nada com todos os candidatos em todas as casas', () => {
    expect(lockedCandidates(open())).toBeNull();
  });

  it('não acha nada quando o número já saiu do resto da linha', () => {
    const grid = open();
    for (const cell of [2, 9, 10, 11, 18, 19, 20, 3, 4, 5, 6, 7, 8]) grid.candidates[cell] = without(4);
    expect(lockedCandidates(grid)).toBeNull();
  });

  it('pointing: o 4 do bloco 0 só está na linha 0, então sai do resto da linha', () => {
    const grid = open();
    for (const cell of [2, 9, 10, 11, 18, 19, 20]) grid.candidates[cell] = without(4);
    const step = lockedCandidates(grid);
    expect(step?.technique).toBe('pointing');
    expect(eliminated(step)).toEqual(['3:4', '4:4', '5:4', '6:4', '7:4', '8:4']);
  });

  it('claiming: o 4 da linha 0 só está no bloco 0, então sai do resto do bloco', () => {
    const grid = open();
    for (const cell of [2, 3, 4, 5, 6, 7, 8]) grid.candidates[cell] = without(4);
    const step = lockedCandidates(grid);
    expect(step?.technique).toBe('pointing');
    expect(eliminated(step)).toEqual(['10:4', '11:4', '18:4', '19:4', '20:4', '9:4']);
  });
});

describe('nakedPair', () => {
  it('duas casas com o mesmo par tiram esses números do resto da linha', () => {
    const grid = open();
    grid.candidates[0] = bit(1) | bit(2);
    grid.candidates[1] = bit(1) | bit(2);
    const step = nakedPair(grid);
    expect(step?.technique).toBe('nakedPair');
    const expected = [2, 3, 4, 5, 6, 7, 8]
      .flatMap((cell) => [`${String(cell)}:1`, `${String(cell)}:2`])
      .sort();
    expect(eliminated(step)).toEqual(expected);
  });
});

describe('nakedPair em outras unidades', () => {
  it('par numa coluna: os números saem do resto da coluna', () => {
    const grid = open();
    grid.candidates[0] = bit(1) | bit(2);
    grid.candidates[9] = bit(1) | bit(2);
    const step = nakedPair(grid);
    const expected = COLS[0]!
      .slice(2)
      .flatMap((cell) => [`${String(cell)}:1`, `${String(cell)}:2`])
      .sort();
    expect(eliminated(step)).toEqual(expected);
  });

  it('par num bloco, em linhas e colunas diferentes: os números saem do resto do bloco', () => {
    const grid = open();
    grid.candidates[0] = bit(1) | bit(2);
    grid.candidates[10] = bit(1) | bit(2);
    const expected = [1, 2, 9, 11, 18, 19, 20]
      .flatMap((cell) => [`${String(cell)}:1`, `${String(cell)}:2`])
      .sort();
    expect(eliminated(nakedPair(grid))).toEqual(expected);
  });

  it('não acha nada quando o par não tem o que eliminar', () => {
    const grid = open();
    for (const cell of ROWS[0]!) grid.candidates[cell] = ALL & ~bit(1) & ~bit(2);
    for (const cell of COLS[0]!) grid.candidates[cell] = ALL & ~bit(1) & ~bit(2);
    for (const cell of COLS[1]!) grid.candidates[cell] = ALL & ~bit(1) & ~bit(2);
    for (const cell of [2, 11, 20]) grid.candidates[cell] = ALL & ~bit(1) & ~bit(2);
    grid.candidates[0] = bit(1) | bit(2);
    grid.candidates[1] = bit(1) | bit(2);
    expect(nakedPair(grid)).toBeNull();
  });
});

describe('hiddenPair', () => {
  it('par oculto numa coluna', () => {
    const grid = open();
    for (const cell of COLS[0]!.slice(2)) grid.candidates[cell] = ALL & ~bit(1) & ~bit(2);
    const step = hiddenPair(grid);
    const expected = [0, 9]
      .flatMap((cell) => [3, 4, 5, 6, 7, 8, 9].map((d) => `${String(cell)}:${String(d)}`))
      .sort();
    expect(eliminated(step)).toEqual(expected);
  });

  it('par oculto num bloco', () => {
    const grid = open();
    for (const cell of [1, 2, 9, 11, 18, 19, 20]) grid.candidates[cell] = ALL & ~bit(1) & ~bit(2);
    const expected = [0, 10]
      .flatMap((cell) => [3, 4, 5, 6, 7, 8, 9].map((d) => `${String(cell)}:${String(d)}`))
      .sort();
    expect(eliminated(hiddenPair(grid))).toEqual(expected);
  });

  it('não acha nada quando as duas casas já só têm o par', () => {
    const grid = open();
    for (const cell of [2, 3, 4, 5, 6, 7, 8]) grid.candidates[cell] = ALL & ~bit(1) & ~bit(2);
    grid.candidates[0] = bit(1) | bit(2);
    grid.candidates[1] = bit(1) | bit(2);
    expect(hiddenPair(grid)).toBeNull();
  });

  it('dois números que só cabem nas mesmas duas casas tiram os outros candidatos delas', () => {
    const grid = open();
    for (const cell of [2, 3, 4, 5, 6, 7, 8]) grid.candidates[cell] = ALL & ~bit(1) & ~bit(2);
    const step = hiddenPair(grid);
    expect(step?.technique).toBe('hiddenPair');
    const expected = [0, 1]
      .flatMap((cell) => [3, 4, 5, 6, 7, 8, 9].map((d) => `${String(cell)}:${String(d)}`))
      .sort();
    expect(eliminated(step)).toEqual(expected);
  });
});

describe('xWing', () => {
  it('o 5 só nas colunas 2 e 6 das linhas 1 e 4 sai dessas colunas nas outras linhas', () => {
    const grid = open();
    for (const row of [1, 4]) {
      for (const cell of ROWS[row]!) grid.candidates[cell] = without(5);
      grid.candidates[row * 9 + 2] = ALL;
      grid.candidates[row * 9 + 6] = ALL;
    }
    const step = xWing(grid);
    expect(step?.technique).toBe('xWing');
    const expected = [0, 2, 3, 5, 6, 7, 8]
      .flatMap((row) => [row * 9 + 2, row * 9 + 6].map((cell) => `${String(cell)}:5`))
      .sort();
    expect(eliminated(step)).toEqual(expected);
  });
});

describe('xWing por colunas', () => {
  it('o 5 só nas linhas 2 e 6 das colunas 1 e 7 sai dessas linhas nas outras colunas', () => {
    const grid = open();
    for (const col of [1, 7]) {
      for (const cell of COLS[col]!) grid.candidates[cell] = without(5);
      grid.candidates[2 * 9 + col] = ALL;
      grid.candidates[6 * 9 + col] = ALL;
    }
    const step = xWing(grid);
    expect(step?.technique).toBe('xWing');
    const expected = [0, 2, 3, 4, 5, 6, 8]
      .flatMap((col) => [2 * 9 + col, 6 * 9 + col].map((cell) => `${String(cell)}:5`))
      .sort();
    expect(eliminated(step)).toEqual(expected);
  });

  it('não acha nada com todos os candidatos em todas as casas', () => {
    expect(xWing(open())).toBeNull();
  });
});

describe('applyStep', () => {
  it('aplica uma colocação e tira o número dos vizinhos', () => {
    const grid = open();
    applyStep(grid, { technique: 'nakedSingle', place: { cell: 0, digit: 3 }, eliminate: [] });
    expect(grid.values[0]).toBe(3);
    expect(grid.candidates[1]! & bit(3)).toBe(0);
  });

  it('aplica eliminações', () => {
    const grid = open();
    applyStep(grid, { technique: 'nakedPair', eliminate: [{ cell: 5, digit: 9 }] });
    expect(grid.candidates[5]! & bit(9)).toBe(0);
  });
});
