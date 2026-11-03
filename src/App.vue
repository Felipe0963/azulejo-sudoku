<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Level } from './game';
import GameScreen from './ui/components/GameScreen.vue';
import HomeScreen from './ui/components/HomeScreen.vue';
import WinScreen from './ui/components/WinScreen.vue';
import { announcementFor } from './ui/content/copy';
import { useAnnouncer } from './ui/composables/useAnnouncer';
import { useBestTimes } from './ui/composables/useBestTimes';
import { useGame } from './ui/composables/useGame';
import { useKeyboard } from './ui/composables/useKeyboard';
import { usePersistence } from './ui/composables/usePersistence';
import { useTimer } from './ui/composables/useTimer';

const game = useGame();
const timer = useTimer();
const persistence = usePersistence();
const bestTimes = useBestTimes();
const paused = ref(false);
const isNewBest = ref(false);

const saved = ref(persistence.read());
const savedSummary = computed(() =>
  saved.value && !saved.value.state.won
    ? { level: saved.value.state.level, elapsedMs: saved.value.elapsedMs }
    : null,
);

function readUrl(): { level: Level | null; seed: number } {
  const params = new URLSearchParams(window.location.search);
  const level = params.get('level');
  const seed = Number(params.get('seed'));
  return {
    level: level === 'easy' || level === 'medium' || level === 'hard' || level === 'expert' ? level : null,
    seed: Number.isInteger(seed) && seed > 0 ? seed : Math.floor(Math.random() * 1_000_000) + 1,
  };
}

function startLevel(level: Level, seed = readUrl().seed) {
  game.start(level, seed);
  timer.reset(0);
  timer.resume();
  paused.value = false;
  isNewBest.value = false;
}

function continueSaved() {
  if (!saved.value) return;
  game.load(saved.value.state);
  timer.reset(saved.value.elapsedMs);
  timer.resume();
  paused.value = false;
}

function goHome() {
  if (game.state.value && !game.state.value.won) persistence.save(game.state.value, timer.elapsedMs.value);
  saved.value = persistence.read();
  timer.pause();
  game.quit();
}

const initial = readUrl();
if (initial.level) startLevel(initial.level, initial.seed);

watch(game.state, (state) => {
  if (!state) return;
  if (state.won) {
    timer.pause();
    isNewBest.value = bestTimes.record(state.level, timer.elapsedMs.value);
    persistence.clear();
    saved.value = null;
  } else {
    persistence.save(state, timer.elapsedMs.value);
  }
});

// Guarda o tempo também ao sair da página, não só a cada jogada.
window.addEventListener('pagehide', () => {
  if (game.state.value && !game.state.value.won) persistence.save(game.state.value, timer.elapsedMs.value);
});

const onKeydown = useKeyboard(() => game.selected.value, {
  select: (cell) => {
    game.selected.value = cell;
  },
  input: game.input,
  erase: game.erase,
  toggleNotes: game.toggleNotes,
  undo: game.undo,
  redo: game.redo,
});

const message = computed(() => announcementFor(game.events.value));
const announcement = useAnnouncer(message, game.actionId);

function pause() {
  paused.value = true;
  timer.pause();
}

function resume() {
  paused.value = false;
  timer.resume();
}
</script>

<template>
  <div class="app">
    <HomeScreen
      v-if="!game.state.value"
      :saved="savedSummary"
      @choose="startLevel($event)"
      @continue="continueSaved"
    />
    <template v-else>
      <GameScreen
        :state="game.state.value"
        :events="game.events.value"
        :action-id="game.actionId.value"
        :selected="game.selected.value"
        :notes-mode="game.notesMode.value"
        :conflicting="game.conflicting.value"
        :remaining="game.remaining.value"
        :elapsed-ms="timer.elapsedMs.value"
        :paused="paused"
        @select="game.selected.value = $event"
        @keydown="onKeydown"
        @input="game.input"
        @erase="game.erase"
        @hint="game.hint"
        @undo="game.undo"
        @redo="game.redo"
        @notes="game.toggleNotes"
        @pause="pause"
        @resume="resume"
        @home="goHome"
      />
      <WinScreen
        v-if="game.state.value.won"
        :level="game.state.value.level"
        :elapsed-ms="timer.elapsedMs.value"
        :hints="game.state.value.hints"
        :best-ms="bestTimes.best.value[game.state.value.level]"
        :is-new-best="isNewBest"
        @again="startLevel(game.state.value.level, Math.floor(Math.random() * 1_000_000) + 1)"
        @change="goHome"
      />
    </template>
    <p class="visually-hidden" aria-live="polite" data-testid="announcer">{{ announcement }}</p>
  </div>
</template>
