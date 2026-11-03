import { deserialize, serialize, type GameState, type Saved } from '../../game';

const KEY = 'azulejo:game';

/** Partida salva no navegador. Qualquer falha de armazenamento é ignorada. */
export function usePersistence() {
  function read(): Saved | null {
    try {
      const text = window.localStorage.getItem(KEY);
      return text ? deserialize(text) : null;
    } catch {
      return null;
    }
  }

  function save(state: GameState, elapsedMs: number) {
    try {
      window.localStorage.setItem(KEY, serialize(state, elapsedMs));
    } catch {
      // Sem armazenamento: o jogo segue sem salvar.
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // Ignorado pelo mesmo motivo.
    }
  }

  return { read, save, clear };
}
