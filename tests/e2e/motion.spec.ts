import { expect, test } from '@playwright/test';
import { cell, openGame, puzzle } from './helpers';

// Sem movimento reduzido: as animações rodam de verdade.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

test('o carimbo nunca mostra dois números em lugares diferentes da casa', async ({ page }) => {
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await cell(page, empty).click();
  // A cada quadro, guarda o centro de cada número desenhado na casa.
  await page.evaluate((index) => {
    const w = window as unknown as { __frames: { x: number; y: number }[][]; __stop: boolean };
    w.__frames = [];
    w.__stop = false;
    const host = document.querySelector(`[data-cell="${String(index)}"]`)!;
    const sample = () => {
      const visible = [...host.querySelectorAll<HTMLElement>('.cell__value')].flatMap((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        // Conta todo número desenhado, mesmo entrando ou saindo com opacidade parcial.
        if (box.width === 0 || box.height === 0 || style.visibility === 'hidden') return [];
        return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
      });
      w.__frames.push(visible);
      if (!w.__stop) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }, empty);
  for (const digit of ['1', '2', '3', '4', '5', '6']) {
    await page.keyboard.press(digit);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(300);
  const frames = await page.evaluate(() => {
    const w = window as unknown as { __frames: { x: number; y: number }[][]; __stop: boolean };
    w.__stop = true;
    return w.__frames;
  });
  expect(frames.length).toBeGreaterThan(10);
  expect(frames.some((visible) => visible.length > 0)).toBe(true);
  const apart = frames.filter((visible) =>
    visible.some((a) => visible.some((b) => Math.hypot(a.x - b.x, a.y - b.y) > 1)),
  );
  expect(apart).toEqual([]);
});
