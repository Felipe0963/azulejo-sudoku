import { parse, type Values } from '../../src/game/grid';
import { conflicts } from '../../src/game/validate';

/** Exemplo clássico da Wikipédia. */
export const CLASSIC = parse(
  '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79',
);
export const CLASSIC_SOLUTION = parse(
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
);
export const EMPTY = Array<number>(81).fill(0);

/** Grade completa e sem conflitos. */
export const isValidSolution = (values: Values): boolean =>
  values.every((value) => value !== 0) && conflicts(values).size === 0;
