<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { LEVELS, pickPuzzle, seedOf, type Level } from './game';
import GameScreen from './ui/components/GameScreen.vue';
import HomeScreen from './ui/components/HomeScreen.vue';
import WinScreen from './ui/components/WinScreen.vue';
import { announcementFor, copy } from './ui/content/copy';
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
/** A tela de vitória espera a cascata do mural terminar. */
const showWin = ref(false);
/** O que a tela de jogo expõe (ver `defineExpose` em GameScreen.vue). */
const gameScreen = ref<{ focusBoard: () => void } | null>(null);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
/** Duração da cascata da vitória no mural (ver `.board--won` em app.css): 8 × 90 ms de atraso + 500 ms. */
const WIN_CASCADE_MS = 1220;

const saved = ref(persistence.read());
const savedSummary = computed(() =>
  saved.value ? { level: saved.value.state.level, elapsedMs: saved.value.elapsedMs } : null,
);

const randomSeed = () => Math.floor(Math.random() * 1_000_000) + 1;
const isLevel = (value: string | null): value is Level =>
  (LEVELS as readonly (string | null)[]).includes(value);

/** Nível e semente da URL. Sem semente válida, sorteia uma. */
function readUrl(): { level: Level; seed: number } | null {
  const params = new URLSearchParams(window.location.search);
  const level = params.get('level');
  if (!isLevel(level)) return null;
  const seed = Number(params.get('seed'));
  return { level, seed: Number.isInteger(seed) && seed > 0 ? seed : randomSeed() };
}

/** A URL mostra a partida atual, para recarregar a página voltar a ela. */
function writeUrl(level: Level | null, seed: number | null) {
  const search = level && seed !== null ? `?level=${level}&seed=${String(seed)}` : '';
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${search}`);
}

function startLevel(level: Level, seed = randomSeed()) {
  game.start(level, seed);
  writeUrl(level, seed);
  timer.reset(0);
  timer.resume();
  paused.value = false;
  isNewBest.value = false;
  showWin.value = false;
}

function continueSaved() {
  if (!saved.value) return;
  const { state, elapsedMs } = saved.value;
  game.load(state);
  writeUrl(state.level, seedOf(state.level, state.puzzle));
  timer.reset(elapsedMs);
  timer.resume();
  paused.value = false;
  showWin.value = false;
}

function saveProgress() {
  const state = game.state.value;
  if (state && !state.won) persistence.save(state, timer.elapsedMs.value);
}

function goHome() {
  saveProgress();
  saved.value = persistence.read();
  timer.pause();
  paused.value = false;
  game.quit();
  writeUrl(null, null);
}

function playAgain() {
  if (!game.state.value) return;
  startLevel(game.state.value.level);
  void nextTick(() => {
    gameScreen.value?.focusBoard();
  });
}

// Abertura: a URL escolhe a partida; se a partida salva é desse mesmo puzzle, ela continua de onde parou.
const initial = readUrl();
if (initial) {
  const puzzle = pickPuzzle(initial.level, initial.seed);
  const state = saved.value?.state;
  if (state?.level === initial.level && state.puzzle.every((value, cell) => value === puzzle[cell])) {
    continueSaved();
    writeUrl(initial.level, initial.seed);
  } else {
    startLevel(initial.level, initial.seed);
  }
}

let winTimer = 0;
watch(game.state, (state) => {
  window.clearTimeout(winTimer);
  if (!state) return;
  if (state.won) {
    timer.pause();
    isNewBest.value = bestTimes.record(state.level, timer.elapsedMs.value);
    persistence.clear();
    saved.value = null;
    winTimer = window.setTimeout(
      () => {
        showWin.value = true;
      },
      reducedMotion.matches ? 0 : WIN_CASCADE_MS,
    );
  } else {
    persistence.save(state, timer.elapsedMs.value);
  }
});

// Guarda o tempo também ao sair da página, não só a cada jogada.
window.addEventListener('pagehide', saveProgress);

/** Anúncios da região aria-live: os eventos de cada jogada e a troca do modo de anotações. */
const notice = shallowRef({ text: '', id: 0 });
const say = (text: string) => {
  notice.value = { text, id: notice.value.id + 1 };
};
watch(game.actionId, () => {
  say(announcementFor(game.events.value));
});
const announcement = useAnnouncer(
  computed(() => notice.value.text),
  computed(() => notice.value.id),
);

/** Ações do jogo: nenhuma vale com a pausa aberta. */
const whilePlaying =
  <A extends unknown[]>(action: (...args: A) => void) =>
  (...args: A) => {
    if (!paused.value) action(...args);
  };

const select = whilePlaying((cell: number) => {
  game.selected.value = cell;
});
const input = whilePlaying(game.input);
const erase = whilePlaying(game.erase);
const hint = whilePlaying(game.hint);
const undo = whilePlaying(game.undo);
const redo = whilePlaying(game.redo);
const toggleNotes = whilePlaying(() => {
  game.toggleNotes();
  say(game.notesMode.value ? copy.notesOn : copy.notesOff);
});

const onKeydown = useKeyboard(() => game.selected.value, { select, input, erase, toggleNotes, undo, redo });

const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.closest('input, textarea, select') !== null);

// Os atalhos valem na tela de jogo inteira (o foco pode estar num botão, ou em lugar nenhum depois de um clique),
// menos com a pausa ou a vitória abertas e dentro de um campo de texto.
function onDocumentKeydown(event: KeyboardEvent) {
  const state = game.state.value;
  if (!state || state.won || paused.value || isTextField(event.target)) return;
  onKeydown(event);
}
onMounted(() => {
  document.addEventListener('keydown', onDocumentKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown);
});

function pause() {
  paused.value = true;
  timer.pause();
}

function resume() {
  paused.value = false;
  timer.resume();
  // O tabuleiro deixa de ser inerte no próximo quadro; aí o foco volta para ele.
  void nextTick(() => {
    gameScreen.value?.focusBoard();
  });
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
        ref="gameScreen"
        :state="game.state.value"
        :events="game.events.value"
        :action-id="game.actionId.value"
        :selected="game.selected.value"
        :notes-mode="game.notesMode.value"
        :conflicting="game.conflicting.value"
        :remaining="game.remaining.value"
        :elapsed-ms="timer.elapsedMs.value"
        :paused="paused"
        @select="select"
        @input="input"
        @erase="erase"
        @hint="hint"
        @undo="undo"
        @redo="redo"
        @notes="toggleNotes"
        @pause="pause"
        @resume="resume"
        @home="goHome"
      />
      <WinScreen
        v-if="game.state.value.won && showWin"
        :level="game.state.value.level"
        :elapsed-ms="timer.elapsedMs.value"
        :hints="game.state.value.hints"
        :best-ms="bestTimes.best.value[game.state.value.level]"
        :is-new-best="isNewBest"
        @again="playAgain"
        @change="goHome"
      />
    </template>
    <p class="visually-hidden" aria-live="polite" data-testid="announcer">{{ announcement }}</p>
  </div>
</template>
