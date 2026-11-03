<script setup lang="ts">
import { computed, ref } from 'vue';
import type { GameEvent, GameState } from '../../game';
import { copy } from '../content/copy';
import SudokuBoard from './SudokuBoard.vue';
import GameHeader from './GameHeader.vue';
import NumberPad from './NumberPad.vue';
import PauseOverlay from './PauseOverlay.vue';
import GameToolbar from './GameToolbar.vue';

const props = defineProps<{
  state: GameState;
  events: readonly GameEvent[];
  actionId: number;
  selected: number | null;
  notesMode: boolean;
  conflicting: ReadonlySet<number>;
  remaining: readonly number[];
  elapsedMs: number;
  paused: boolean;
}>();
const emit = defineEmits<{
  select: [cell: number];
  input: [digit: number];
  erase: [];
  hint: [];
  undo: [];
  redo: [];
  notes: [];
  pause: [];
  resume: [];
  home: [];
}>();

/** O que o tabuleiro expõe (ver `defineExpose` em SudokuBoard.vue). */
const board = ref<{ focus: () => void } | null>(null);

const shakeCells = computed(() => {
  const conflict = props.events.find((event) => event.type === 'conflict');
  return new Set(conflict?.type === 'conflict' ? conflict.cells : []);
});

/** Painéis vitrificados pela última jogada: só eles animam (ao carregar a partida, o mural aparece pronto). */
const glazing = computed(
  () => new Set(props.events.flatMap((event) => (event.type === 'glazed' ? [event.box] : []))),
);

defineExpose({
  /** Foco na casa selecionada, ou no tabuleiro se não houver uma. */
  focusBoard: () => {
    board.value?.focus();
  },
});
</script>

<template>
  <main class="game">
    <h1 class="visually-hidden">{{ copy.title }}</h1>
    <!-- Com a pausa aberta, tudo fica inerte menos o diálogo: nem clique, nem foco, nem leitor de tela. -->
    <GameHeader
      :level="state.level"
      :elapsed-ms="elapsedMs"
      :paused="paused"
      :inert="paused"
      @pause="emit('pause')"
      @home="emit('home')"
    />
    <div class="board-wrap">
      <SudokuBoard
        ref="board"
        :state="state"
        :selected="selected"
        :conflicting="conflicting"
        :shake-cells="shakeCells"
        :shake-key="actionId"
        :glazing="glazing"
        :inert="paused"
        @select="emit('select', $event)"
      />
      <PauseOverlay v-if="paused" @resume="emit('resume')" />
    </div>
    <div class="panel" :inert="paused">
      <GameToolbar
        :notes-mode="notesMode"
        :can-undo="state.past.length > 0"
        :can-redo="state.future.length > 0"
        @undo="emit('undo')"
        @redo="emit('redo')"
        @erase="emit('erase')"
        @notes="emit('notes')"
        @hint="emit('hint')"
      />
      <NumberPad :remaining="remaining" @input="emit('input', $event)" />
    </div>
  </main>
</template>
