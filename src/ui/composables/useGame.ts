import { computed, ref, shallowRef } from 'vue';
import {
  apply,
  conflicts,
  newGame,
  pickPuzzle,
  type Action,
  type GameEvent,
  type GameState,
  type Level,
} from '../../game';

/** Estado da partida e ações. O motor decide tudo; aqui só guardamos o estado e os últimos eventos. */
export function useGame() {
  const state = shallowRef<GameState | null>(null);
  const events = shallowRef<readonly GameEvent[]>([]);
  /** Aumenta a cada ação, para anúncios e animações reagirem mesmo com eventos iguais. */
  const actionId = ref(0);
  const selected = ref<number | null>(null);
  const notesMode = ref(false);

  function start(level: Level, seed: number) {
    state.value = newGame(level, pickPuzzle(level, seed));
    events.value = [];
    selected.value = null;
    notesMode.value = false;
  }

  function load(saved: GameState) {
    state.value = saved;
    events.value = [];
    selected.value = null;
  }

  function dispatch(action: Action) {
    if (!state.value) return;
    const result = apply(state.value, action);
    state.value = result.state;
    events.value = result.events;
    actionId.value++;
  }

  function input(digit: number) {
    const cell = selected.value;
    if (cell === null) return;
    dispatch(notesMode.value ? { type: 'toggleNote', cell, digit } : { type: 'place', cell, digit });
  }

  const erase = () => {
    if (selected.value !== null) dispatch({ type: 'erase', cell: selected.value });
  };
  const hint = () => {
    dispatch({ type: 'hint', cell: selected.value });
  };
  const undo = () => {
    dispatch({ type: 'undo' });
  };
  const redo = () => {
    dispatch({ type: 'redo' });
  };
  const toggleNotes = () => {
    notesMode.value = !notesMode.value;
  };
  const quit = () => {
    state.value = null;
  };

  const conflicting = computed(() => (state.value ? conflicts(state.value.values) : new Set<number>()));
  const remaining = computed(() => {
    const left = Array<number>(10).fill(9);
    for (const value of state.value?.values ?? []) if (value !== 0) left[value]!--;
    return left;
  });

  return {
    state,
    events,
    actionId,
    selected,
    notesMode,
    conflicting,
    remaining,
    start,
    load,
    input,
    erase,
    hint,
    undo,
    redo,
    toggleNotes,
    quit,
  };
}
