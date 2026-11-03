import { describe, expect, it } from 'vitest';
import {
  BOXES,
  COLS,
  PEERS,
  ROWS,
  UNITS,
  boxOf,
  cellAt,
  colOf,
  format,
  parse,
  rowOf,
} from '../../src/game/grid';
import { ALL, bit, count, digits, fromValues, has } from '../../src/game/candidates';
import { CLASSIC } from './fixtures';

describe('grid', () => {
  it('converte entre casa, linha, coluna e bloco', () => {
    expect([rowOf(40), colOf(40), boxOf(40)]).toEqual([4, 4, 4]);
    expect([rowOf(80), colOf(80), boxOf(80)]).toEqual([8, 8, 8]);
    expect(boxOf(cellAt(2, 6))).toBe(2);
    expect(cellAt(4, 4)).toBe(40);
  });

  it('tem 27 unidades de 9 casas', () => {
    expect(ROWS).toHaveLength(9);
    expect(COLS).toHaveLength(9);
    expect(BOXES).toHaveLength(9);
    expect(UNITS).toHaveLength(27);
    for (const unit of UNITS) expect(new Set(unit).size).toBe(9);
    expect(BOXES[0]).toEqual([0, 1, 2, 9, 10, 11, 18, 19, 20]);
  });

  it('cada casa tem 20 vizinhos, sem ela mesma', () => {
    for (let cell = 0; cell < 81; cell++) {
      expect(PEERS[cell]).toHaveLength(20);
      expect(PEERS[cell]).not.toContain(cell);
    }
  });

  it('parse e format são inversos', () => {
    const text = '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79';
    expect(format(parse(text))).toBe(text);
    expect(parse(text.replaceAll('.', '0'))).toEqual(parse(text));
  });

  it('parse recusa texto inválido', () => {
    expect(() => parse('123')).toThrow();
    expect(() => parse('x'.repeat(81))).toThrow();
  });
});

describe('candidates', () => {
  it('máscaras de bits', () => {
    expect(bit(1)).toBe(1);
    expect(bit(9)).toBe(256);
    expect(count(ALL)).toBe(9);
    expect(digits(bit(2) | bit(7))).toEqual([2, 7]);
    expect(has(bit(4), 4)).toBe(true);
    expect(has(bit(4), 5)).toBe(false);
  });

  it('fromValues tira dos candidatos os números dos vizinhos', () => {
    const grid = fromValues(CLASSIC);
    expect(grid.candidates[0]).toBe(0);
    // Linha 0 tem 5, 3, 7; coluna 2 tem 8; bloco 0 tem 5, 3, 6, 9, 8.
    expect(digits(grid.candidates[2]!)).toEqual([1, 2, 4]);
  });
});
