<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { Level } from '../../game';
import { copy, formatTime } from '../content/copy';

defineProps<{
  level: Level;
  elapsedMs: number;
  hints: number;
  bestMs: number | undefined;
  isNewBest: boolean;
}>();
const emit = defineEmits<{ again: []; change: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
/**
 * Com o diálogo modal aberto, o resto da página fica inerte, inclusive a região aria-live dela; por isso a vitória
 * é anunciada aqui dentro. O texto entra depois de abrir, para a mudança ser anunciada.
 */
const status = ref('');
let timer = 0;
onMounted(() => {
  dialog.value?.showModal();
  timer = window.setTimeout(() => {
    status.value = copy.won;
  }, 100);
});
onBeforeUnmount(() => {
  window.clearTimeout(timer);
});
</script>

<template>
  <dialog ref="dialog" class="win" aria-labelledby="win-title" @cancel.prevent>
    <h2 id="win-title">{{ copy.won }}</h2>
    <p class="visually-hidden" role="status" data-testid="win-status">{{ status }}</p>
    <p v-if="isNewBest">{{ copy.newBestTime }}</p>
    <dl>
      <dt>{{ copy.time }}</dt>
      <dd>{{ formatTime(elapsedMs) }}</dd>
      <dt>{{ copy.level }}</dt>
      <dd>{{ copy.levels[level] }}</dd>
      <dt>{{ copy.hints }}</dt>
      <dd>{{ hints }}</dd>
      <dt>{{ copy.bestTime }}</dt>
      <dd>{{ bestMs === undefined ? '—' : formatTime(bestMs) }}</dd>
    </dl>
    <div class="actions">
      <button type="button" @click="emit('again')">{{ copy.playAgain }}</button>
      <button type="button" @click="emit('change')">{{ copy.changeLevel }}</button>
    </div>
  </dialog>
</template>
