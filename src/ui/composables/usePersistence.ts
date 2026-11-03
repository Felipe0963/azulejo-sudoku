import { deserialize, serialize, type GameState, type Saved } from '../../game';

const KEY = 'azulejo:game';

/** Partida salva no navegador. Qualquer falha de armazenamento é ignorada. */
export function usePersistence() {
  /** Lê a partida salva. Uma partida inválida (corrompida, de outra versão ou já vencida) é apagada. */
  function read(): Saved | null {
    let text: string | null;
    try {
      text = window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
    if (!text) return null;
    const saved = deserialize(text);
    if (!saved) clear();
    return saved;
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
