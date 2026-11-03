<script setup lang="ts">
import { copy } from '../content/copy';

defineProps<{ remaining: readonly number[] }>();
const emit = defineEmits<{ input: [digit: number] }>();
</script>

<template>
  <div class="number-pad">
    <button
      v-for="digit in 9"
      :key="digit"
      type="button"
      class="number-key"
      :aria-label="copy.placeLabel(digit, remaining[digit]!)"
      :disabled="remaining[digit] === 0"
      @click="emit('input', digit)"
    >
      <span aria-hidden="true">{{ digit }}</span>
      <small aria-hidden="true">{{ remaining[digit] }}</small>
    </button>
  </div>
</template>
