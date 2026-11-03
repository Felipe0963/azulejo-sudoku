import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newGame } from '../../src/game/game';
import { usePersistence } from '../../src/ui/composables/usePersistence';
import { CLASSIC } from './fixtures';

const KEY = 'azulejo:game';

describe('usePersistence', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('salva e lê de volta a partida', () => {
    const persistence = usePersistence();
    persistence.save(newGame('easy', CLASSIC), 5000);
    expect(persistence.read()?.elapsedMs).toBe(5000);
    expect(store.has(KEY)).toBe(true);
  });

  it.each([
    ['texto que não é JSON', 'not json'],
    ['versão antiga', JSON.stringify({ version: 0 })],
  ])('apaga a partida salva inválida (%s)', (_, text) => {
    store.set(KEY, text);
    expect(usePersistence().read()).toBeNull();
    expect(store.has(KEY)).toBe(false);
  });

  it('sem armazenamento, lê null e salva sem erro', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('blocked');
      },
    });
    const persistence = usePersistence();
    expect(persistence.read()).toBeNull();
    expect(() => {
      persistence.save(newGame('easy', CLASSIC), 0);
    }).not.toThrow();
  });
});
