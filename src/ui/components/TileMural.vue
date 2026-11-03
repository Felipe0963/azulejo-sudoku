<script setup lang="ts">
defineProps<{ glazed: readonly boolean[] }>();

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
</script>

<template>
  <svg class="board__mural" viewBox="0 0 900 900" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <clipPath v-for="panel in panels" :id="`mural-panel-${panel.index}`" :key="panel.index">
        <rect :x="panel.x" :y="panel.y" :width="PANEL" :height="PANEL" />
      </clipPath>
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
        <g fill="none" stroke="var(--white)" stroke-opacity="0.35" stroke-width="3">
          <path d="M450 0 L900 450 L450 900 L0 450 Z" />
          <circle cx="450" cy="450" r="60" />
        </g>
      </g>
    </defs>
    <g
      v-for="panel in panels"
      :key="panel.index"
      class="mural__panel"
      :class="{ 'mural__panel--glazed': glazed[panel.index] }"
      :clip-path="`url(#mural-panel-${panel.index})`"
    >
      <use href="#mural-art" />
    </g>
  </svg>
</template>
