import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // No GitHub Pages o site fica em /<repo>/; localmente continua em /.
  base: process.env.BASE_PATH ?? '/',
  plugins: [vue()],
  test: { include: ['tests/unit/**/*.test.ts'] },
});
