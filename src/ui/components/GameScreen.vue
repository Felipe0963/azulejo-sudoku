<script setup lang="ts">
import { computed } from 'vue';
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
  keydown: [event: KeyboardEvent];
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

const shakeCells = computed(() => {
  const conflict = props.events.find((event) => event.type === 'conflict');
  return new Set(conflict?.type === 'conflict' ? conflict.cells : []);
});
</script>

<template>
  <main class="game">
    <h1 class="visually-hidden">{{ copy.title }}</h1>
    <GameHeader
      :level="state.level"
      :elapsed-ms="elapsedMs"
      :paused="paused"
      @pause="emit('pause')"
      @home="emit('home')"
    />
    <div class="board-wrap">
      <SudokuBoard
        :state="state"
        :selected="selected"
        :conflicting="conflicting"
        :shake-cells="shakeCells"
        :shake-key="actionId"
        @select="emit('select', $event)"
        @keydown="emit('keydown', $event)"
      />
      <PauseOverlay v-if="paused" @resume="emit('resume')" />
    </div>
    <div class="panel">
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
