<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { boxOf, colOf, digits, rowOf, type GameState } from '../../game';
import { copy } from '../content/copy';
import BoardCell from './BoardCell.vue';
import TileMural from './TileMural.vue';

const props = defineProps<{
  state: GameState;
  selected: number | null;
  conflicting: ReadonlySet<number>;
  shakeCells: ReadonlySet<number>;
  shakeKey: number;
}>();
const emit = defineEmits<{ select: [cell: number]; keydown: [event: KeyboardEvent] }>();

const grid = ref<HTMLElement | null>(null);
const rows = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, col) => row * 9 + col));

const isPeer = (cell: number) => {
  const s = props.selected;
  if (s === null) return false;
  return rowOf(cell) === rowOf(s) || colOf(cell) === colOf(s) || boxOf(cell) === boxOf(s);
};

const isSame = (cell: number) => {
  const s = props.selected;
  if (s === null) return false;
  const value = props.state.values[s]!;
  return value !== 0 && cell !== s && props.state.values[cell] === value;
};

const glazedCell = (cell: number) => props.state.glazed[boxOf(cell)] === true;

// Leva o foco do teclado para a casa selecionada.
watch(
  () => props.selected,
  async (cell) => {
    if (cell === null) return;
    await nextTick();
    grid.value?.querySelector<HTMLElement>(`[data-cell="${String(cell)}"]`)?.focus();
  },
);
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -- a regra não lê o :tabindex ligado; o tabuleiro tem tabindex 0 até haver casa selecionada (uma só parada de Tab) -->
  <div
    ref="grid"
    class="board"
    role="grid"
    :aria-label="copy.boardLabel"
    :tabindex="selected === null ? 0 : -1"
    @keydown="emit('keydown', $event)"
    @focus="selected === null && emit('select', 0)"
  >
    <TileMural :glazed="state.glazed" />
    <div v-for="(row, r) in rows" :key="r" role="row" class="board__row">
      <BoardCell
        v-for="index in row"
        :key="index"
        :cell="index"
        :value="state.values[index]!"
        :given="state.puzzle[index] !== 0"
        :notes="digits(state.notes[index]!)"
        :selected="selected === index"
        :peer="isPeer(index)"
        :same="isSame(index)"
        :conflict="conflicting.has(index)"
        :glazed="glazedCell(index)"
        :shake="shakeCells.has(index)"
        :shake-key="shakeKey"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>
