import { ref } from 'vue';
import { LEVELS, type Level } from '../../game';

const KEY = 'azulejo:best-times';

function readAll(): Partial<Record<Level, number>> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '{}');
    if (typeof parsed !== 'object' || parsed === null) return {};
    // Só aceita tempos válidos dos níveis conhecidos; o resto do que estiver salvo é ignorado.
    const best: Partial<Record<Level, number>> = {};
    for (const level of LEVELS) {
      const ms: unknown = (parsed as Record<string, unknown>)[level];
      if (typeof ms === 'number' && Number.isFinite(ms) && ms >= 0) best[level] = ms;
    }
    return best;
  } catch {
    return {};
  }
}

/** Melhor tempo por nível. `record` devolve true quando o tempo é um novo recorde. */
export function useBestTimes() {
  const best = ref(readAll());

  function record(level: Level, ms: number): boolean {
    const previous = best.value[level];
    if (previous !== undefined && previous <= ms) return false;
    best.value = { ...best.value, [level]: ms };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(best.value));
    } catch {
      // Sem armazenamento: o recorde vale só nesta visita.
    }
    return true;
  }

  return { best, record };
}
