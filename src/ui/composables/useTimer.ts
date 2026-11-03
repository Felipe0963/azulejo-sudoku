import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * Cronômetro em milissegundos. Pausa quando `pause` é chamado e enquanto a aba está oculta; volta sozinho com a
 * aba visível só se foi a aba que o pausou.
 */
export function useTimer() {
  const elapsedMs = ref(0);
  let running = false;
  /** O jogo quer o cronômetro andando, mas a aba está oculta. */
  let pausedByVisibility = false;
  let startedAt = 0;
  let base = 0;
  let interval = 0;

  const tick = () => {
    elapsedMs.value = base + (performance.now() - startedAt);
  };

  function start() {
    if (running) return;
    running = true;
    startedAt = performance.now();
    interval = window.setInterval(tick, 250);
  }

  function stop() {
    if (!running) return;
    tick();
    base = elapsedMs.value;
    running = false;
    window.clearInterval(interval);
  }

  /** Retoma; com a aba oculta, só começa a contar quando ela voltar. */
  function resume() {
    if (document.visibilityState === 'hidden') {
      pausedByVisibility = true;
      return;
    }
    start();
  }

  /** Pausa pedida pelo jogo: a volta da aba não retoma. */
  function pause() {
    pausedByVisibility = false;
    stop();
  }

  function reset(ms = 0) {
    pause();
    base = ms;
    elapsedMs.value = ms;
  }

  const onVisibility = () => {
    if (document.visibilityState === 'hidden' && running) {
      stop();
      pausedByVisibility = true;
    } else if (document.visibilityState === 'visible' && pausedByVisibility) {
      pausedByVisibility = false;
      start();
    }
  };

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility);
  });
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.clearInterval(interval);
  });

  return { elapsedMs, resume, pause, reset };
}
