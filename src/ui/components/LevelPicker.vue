<script setup lang="ts">
import { LEVELS, type Level } from '../../game';
import { copy } from '../content/copy';

const emit = defineEmits<{ choose: [level: Level] }>();
</script>

<template>
  <section aria-labelledby="choose-level">
    <h2 id="choose-level">{{ copy.chooseLevel }}</h2>
    <div class="levels">
      <button
        v-for="level in LEVELS"
        :key="level"
        type="button"
        class="level-tile"
        @click="emit('choose', level)"
      >
        {{ copy.levels[level] }}
      </button>
    </div>
  </section>
</template>
