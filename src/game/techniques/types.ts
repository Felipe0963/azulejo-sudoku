import type { CandidateGrid } from '../candidates';

export type TechniqueId = 'nakedSingle' | 'hiddenSingle' | 'pointing' | 'nakedPair' | 'hiddenPair' | 'xWing';

export interface Placement {
  readonly cell: number;
  readonly digit: number;
}

/** Um passo de raciocínio: uma colocação, ou candidatos a eliminar. */
export interface Step {
  readonly technique: TechniqueId;
  readonly place?: Placement;
  readonly eliminate: readonly Placement[];
}

/** Procura um passo que faça progresso. Não altera a grade. */
export type Technique = (grid: Readonly<CandidateGrid>) => Step | null;
