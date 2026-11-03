<script setup lang="ts">
import type { Level } from '../../game';
import { copy } from '../content/copy';
import LevelPicker from './LevelPicker.vue';

defineProps<{ saved: { level: Level; elapsedMs: number } | null }>();
const emit = defineEmits<{ choose: [level: Level]; continue: [] }>();

// Uma faixa de cinco azulejos: rosácea de quatro pétalas e quartos de círculo nos cantos, que se juntam entre vizinhos.
const petals = [0, 90, 180, 270];
const corners = [
  [0, 0],
  [100, 0],
  [0, 100],
  [100, 100],
] as const;
</script>

<template>
  <main class="home">
    <svg class="home__band" viewBox="0 0 500 100" aria-hidden="true" focusable="false">
      <defs>
        <g id="home-tile">
          <rect width="100" height="100" fill="var(--glaze)" />
          <g fill="none" stroke="var(--cobalt)" stroke-width="4">
            <circle v-for="[x, y] in corners" :key="`${x}-${y}`" :cx="x" :cy="y" r="24" />
            <circle cx="50" cy="50" r="34" />
          </g>
          <ellipse
            v-for="angle in petals"
            :key="angle"
            cx="50"
            cy="30"
            rx="9"
            ry="17"
            fill="var(--cobalt)"
            :transform="`rotate(${String(angle)} 50 50)`"
          />
          <circle cx="50" cy="50" r="7" fill="var(--glaze)" stroke="var(--cobalt)" stroke-width="4" />
        </g>
      </defs>
      <use v-for="i in 5" :key="i" href="#home-tile" :x="(i - 1) * 100" />
    </svg>
    <h1>{{ copy.title }}</h1>
    <p>{{ copy.subtitle }}</p>
    <template v-if="saved">
      <button type="button" class="continue" @click="emit('continue')">
        <span>{{ copy.continue }}</span>
        <small>{{ copy.continueDetail(saved.level, saved.elapsedMs) }}</small>
      </button>
      <p>{{ copy.replaceWarning }}</p>
    </template>
    <LevelPicker @choose="emit('choose', $event)" />
  </main>
</template>
