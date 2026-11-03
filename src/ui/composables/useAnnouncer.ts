import { ref, watch, type Ref } from 'vue';

/** Texto da região aria-live. Limpa e preenche de novo a cada ação, para repetir mensagens iguais. */
export function useAnnouncer(message: Ref<string>, id: Ref<number>) {
  const text = ref('');
  let timer = 0;
  watch([message, id], ([next]) => {
    window.clearTimeout(timer);
    text.value = '';
    if (!next) return;
    timer = window.setTimeout(() => {
      text.value = next;
    }, 50);
  });
  return text;
}
