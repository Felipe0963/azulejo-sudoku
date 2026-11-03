<script setup lang="ts">
defineProps<{
  glazed: readonly boolean[];
  /** Painéis que acabaram de ser vitrificados: o padrão nasce do centro e um brilho atravessa o painel. */
  glazing: ReadonlySet<number>;
  /** Vitória: os nove painéis brilham em cascata. */
  won: boolean;
}>();

const PANEL = 300;
const panels = Array.from({ length: 9 }, (_, index) => ({
  index,
  x: (index % 3) * PANEL,
  y: Math.floor(index / 3) * PANEL,
}));
const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
const corners = [
  [0, 0],
  [900, 0],
  [0, 900],
  [900, 900],
] as const;

/**
 * Voluta em S: duas espirais de Arquimedes ligadas pelo meio. A espiral da esquerda gira em torno de (-d, 0) e
 * termina na origem indo para a direita; a da direita é o reflexo dela pela origem, então a curva passa pelo meio
 * sem quebra.
 */
function scroll(d: number, turns = 1.25): string {
  const end = turns * 2 * Math.PI;
  const k = d / end;
  const left = (theta: number): [number, number] => {
    const angle = theta - end;
    return [-d + k * theta * Math.cos(angle), k * theta * Math.sin(angle)];
  };
  const steps = 48;
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) points.push(left((end * i) / steps));
  for (let i = steps - 1; i >= 0; i--) {
    const [x, y] = left((end * i) / steps);
    points.push([-x, -y]);
  }
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
}

const ROSETTE_SCROLL = scroll(36);
const CORNER_SCROLL = scroll(22);
/** Oito volutas na faixa entre os círculos de raio 330 e 420, deitadas ao longo dela. */
const rosetteScrolls = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);
/** Uma voluta em cada canto, na faixa entre os quartos de círculo de raio 110 e 180, na diagonal. */
const cornerScrolls = corners.map(([x, y]) => {
  const angle = Math.atan2(450 - y, 450 - x);
  return {
    x: x + Math.cos(angle) * 145,
    y: y + Math.sin(angle) * 145,
    rotate: (angle * 180) / Math.PI + 90,
  };
});
</script>

<template>
  <svg class="board__mural" viewBox="0 0 900 900" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <clipPath v-for="panel in panels" :id="`mural-panel-${panel.index}`" :key="panel.index">
        <rect :x="panel.x" :y="panel.y" :width="PANEL" :height="PANEL" />
      </clipPath>
      <!-- Brilho fraco de propósito: mais forte, os números brancos ficariam abaixo de 4,5:1 sobre o mural. -->
      <linearGradient id="mural-shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="var(--white)" stop-opacity="0" />
        <stop offset="0.5" stop-color="var(--white)" stop-opacity="0.06" />
        <stop offset="1" stop-color="var(--white)" stop-opacity="0" />
      </linearGradient>
      <g id="mural-art">
        <rect width="900" height="900" fill="var(--cobalt)" />
        <g fill="none" stroke="var(--cobalt-soft)" stroke-width="10">
          <circle v-for="r in [420, 330, 240, 150]" :key="r" cx="450" cy="450" :r="r" />
          <ellipse
            v-for="angle in petals"
            :key="angle"
            cx="450"
            cy="250"
            rx="46"
            ry="150"
            :transform="`rotate(${angle} 450 450)`"
          />
          <circle v-for="[x, y] in corners" :key="`${x}-${y}`" :cx="x" :cy="y" r="180" />
          <circle v-for="[x, y] in corners" :key="`inner-${x}-${y}`" :cx="x" :cy="y" r="110" />
        </g>
        <g fill="none" stroke="var(--cobalt-soft)" stroke-width="8" stroke-linecap="round">
          <path
            v-for="angle in rosetteScrolls"
            :key="`scroll-${angle}`"
            :d="ROSETTE_SCROLL"
            :transform="`rotate(${angle} 450 450) translate(450 75)`"
          />
          <path
            v-for="corner in cornerScrolls"
            :key="`corner-scroll-${corner.x}-${corner.y}`"
            :d="CORNER_SCROLL"
            :transform="`translate(${corner.x} ${corner.y}) rotate(${corner.rotate})`"
          />
        </g>
        <g fill="none" stroke="var(--cobalt-deep)" stroke-width="3">
          <path d="M450 0 L900 450 L450 900 L0 450 Z" />
          <circle cx="450" cy="450" r="60" />
        </g>
      </g>
    </defs>
    <g
      v-for="panel in panels"
      :key="panel.index"
      class="mural__panel"
      :class="{
        'mural__panel--glazed': glazed[panel.index],
        'mural__panel--glazing': glazing.has(panel.index),
      }"
      :clip-path="`url(#mural-panel-${panel.index})`"
      :style="{
        '--cx': `${panel.x + PANEL / 2}px`,
        '--cy': `${panel.y + PANEL / 2}px`,
        '--order': panel.index,
      }"
    >
      <g class="mural__art"><use href="#mural-art" /></g>
      <rect
        v-if="glazing.has(panel.index) || won"
        class="mural__shine"
        :x="panel.x - PANEL"
        :y="panel.y"
        :width="PANEL"
        :height="PANEL"
        fill="url(#mural-shine)"
      />
    </g>
  </svg>
</template>
