<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { copy } from '../content/copy';
import NotesGrid from './NotesGrid.vue';

const props = defineProps<{
  cell: number;
  value: number;
  given: boolean;
  notes: readonly number[];
  selected: boolean;
  peer: boolean;
  same: boolean;
  conflict: boolean;
  glazed: boolean;
  shake: boolean;
  shakeKey: number;
}>();
const emit = defineEmits<{ select: [cell: number] }>();

const root = ref<HTMLElement | null>(null);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Tremor de conflito pela Web Animations API: reinicia a cada ação sem recriar a casa (que perderia o foco).
watch(
  () => props.shakeKey,
  () => {
    if (!props.shake || reducedMotion.matches) return;
    root.value?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 260, easing: 'ease-in-out' },
    );
  },
);

const label = computed(() =>
  copy.cellLabel({
    cell: props.cell,
    value: props.value,
    given: props.given,
    notes: props.notes,
    conflict: props.conflict,
    glazed: props.glazed,
  }),
);
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/interactive-supports-focus -- o teclado é tratado no tabuleiro (role="grid"); a regra não lê o :tabindex ligado (0 na casa selecionada, -1 nas outras) -->
  <div
    ref="root"
    role="gridcell"
    class="cell"
    :class="{
      'cell--given': given,
      'cell--selected': selected,
      'cell--peer': peer && !selected,
      'cell--same': same && !selected,
      'cell--conflict': conflict,
      'cell--glazed': glazed,
    }"
    :tabindex="selected ? 0 : -1"
    :aria-selected="selected"
    :aria-label="label"
    :data-cell="cell"
    @click="emit('select', cell)"
  >
    <Transition name="stamp">
      <span v-if="value !== 0" :key="value" :class="{ 'cell__value--player': !given }" aria-hidden="true">
        {{ value }}
      </span>
      <NotesGrid v-else-if="notes.length > 0" :notes="notes" />
    </Transition>
  </div>
</template>
