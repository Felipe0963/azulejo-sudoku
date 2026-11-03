<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { copy } from '../content/copy';

const emit = defineEmits<{ resume: [] }>();
const button = ref<HTMLButtonElement | null>(null);
onMounted(() => {
  button.value?.focus();
});

// O resto da página está inerte; o Tab não sai do diálogo (o único controle é "Resume").
function trapTab(event: KeyboardEvent) {
  if (event.key !== 'Tab') return;
  event.preventDefault();
  button.value?.focus();
}
</script>

<template>
  <div class="pause-overlay" role="dialog" aria-modal="true" :aria-label="copy.paused">
    <p>{{ copy.paused }}</p>
    <button ref="button" type="button" @click="emit('resume')" @keydown="trapTab">{{ copy.resume }}</button>
  </div>
</template>
