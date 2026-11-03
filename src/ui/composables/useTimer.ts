import { onBeforeUnmount, onMounted, ref } from 'vue';

/** Cronômetro em milissegundos. Pausa com a aba oculta e quando `pause` é chamado. */
export function useTimer() {
  const elapsedMs = ref(0);
  const running = ref(false);
  let startedAt = 0;
  let base = 0;
  let interval = 0;

  const tick = () => {
    elapsedMs.value = base + (performance.now() - startedAt);
  };

  function resume() {
    if (running.value) return;
    running.value = true;
    startedAt = performance.now();
    interval = window.setInterval(tick, 250);
  }

  function pause() {
    if (!running.value) return;
    tick();
    base = elapsedMs.value;
    running.value = false;
    window.clearInterval(interval);
  }

  function reset(ms = 0) {
    pause();
    base = ms;
    elapsedMs.value = ms;
  }

  let pausedByVisibility = false;
  const onVisibility = () => {
    if (document.visibilityState === 'hidden' && running.value) {
      pausedByVisibility = true;
      pause();
    } else if (document.visibilityState === 'visible' && pausedByVisibility) {
      pausedByVisibility = false;
      resume();
    }
  };

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility);
  });
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.clearInterval(interval);
  });

  return { elapsedMs, running, resume, pause, reset };
}
