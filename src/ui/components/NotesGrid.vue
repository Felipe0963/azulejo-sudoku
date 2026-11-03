<script setup lang="ts">
defineProps<{ notes: readonly number[] }>();
</script>

<template>
  <span class="notes" aria-hidden="true">
    <span v-for="digit in 9" :key="digit">{{ notes.includes(digit) ? digit : '' }}</span>
  </span>
</template>
