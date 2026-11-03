<script setup lang="ts">
defineProps<{ notes: readonly number[] }>();
</script>

<template>
  <!-- Os espaços entre as anotações deixam o texto visível ("1 4") contido no nome acessível da casa ("notes 1, 4"). -->
  <span class="notes" aria-hidden="true">
    <template v-for="digit in 9" :key="digit"
      ><span>{{ notes.includes(digit) ? digit : '' }}</span
      >{{ ' ' }}</template
    >
  </span>
</template>
