<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { copy } from '../content/copy';

const emit = defineEmits<{ resume: [] }>();
const button = ref<HTMLButtonElement | null>(null);
onMounted(() => {
  button.value?.focus();
});
</script>

<template>
  <div class="pause-overlay" role="dialog" aria-modal="true" :aria-label="copy.paused">
    <p>{{ copy.paused }}</p>
    <button ref="button" type="button" @click="emit('resume')">{{ copy.resume }}</button>
  </div>
</template>
