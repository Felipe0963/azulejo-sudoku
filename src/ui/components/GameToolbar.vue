<script setup lang="ts">
import { copy } from '../content/copy';

defineProps<{ notesMode: boolean; canUndo: boolean; canRedo: boolean }>();
const emit = defineEmits<{ undo: []; redo: []; erase: []; notes: []; hint: [] }>();
</script>

<template>
  <div class="toolbar">
    <button type="button" class="tool" :disabled="!canUndo" @click="emit('undo')">{{ copy.undo }}</button>
    <button type="button" class="tool" :disabled="!canRedo" @click="emit('redo')">{{ copy.redo }}</button>
    <button type="button" class="tool" @click="emit('erase')">{{ copy.erase }}</button>
    <button
      type="button"
      class="tool"
      :aria-pressed="notesMode"
      :aria-label="notesMode ? copy.notesOn : copy.notesOff"
      @click="emit('notes')"
    >
      {{ copy.notes }}
    </button>
    <button type="button" class="tool" @click="emit('hint')">{{ copy.hint }}</button>
  </div>
</template>
