<script setup lang="ts">
import type { Level } from '../../game';
import { copy } from '../content/copy';
import LevelPicker from './LevelPicker.vue';

defineProps<{ saved: { level: Level; elapsedMs: number } | null }>();
const emit = defineEmits<{ choose: [level: Level]; continue: [] }>();
</script>

<template>
  <main class="home">
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
