<script setup lang="ts">
import type { Level } from '../../game';
import { copy, formatTime } from '../content/copy';

defineProps<{ level: Level; elapsedMs: number; paused: boolean }>();
const emit = defineEmits<{ pause: []; home: [] }>();
</script>

<template>
  <header class="game-header">
    <button type="button" class="tool" @click="emit('home')">{{ copy.changeLevel }}</button>
    <span>{{ copy.levels[level] }}</span>
    <span class="time"
      ><span class="visually-hidden">{{ copy.time }} </span>{{ formatTime(elapsedMs) }}</span
    >
    <button type="button" class="tool" :disabled="paused" @click="emit('pause')">{{ copy.pause }}</button>
  </header>
</template>
