import { expect, test } from '@playwright/test';
import { BOXES } from '../../src/game';
import { cell, openGame, puzzle, solution, type } from './helpers';

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

test('ao vitrificar, o número só fica branco depois que o padrão cobre a casa inteira', async ({ page }) => {
  await openGame(page);
  const values = puzzle();
  const box = BOXES.findIndex((cells) => cells.filter((c) => values[c] === 0).length >= 2);
  const empties = BOXES[box]!.filter((c) => values[c] === 0);
  for (const index of empties.slice(0, -1)) await type(page, index, solution()[index]!);
  await type(page, empties.at(-1)!, solution()[empties.at(-1)!]!);
  // Congela as animações e confere quadro a quadro.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.pause();
  });
  const problems: string[] = [];
  for (let t = 0; t <= 700; t += 25) {
    const found = await page.evaluate((time) => {
      for (const animation of document.getAnimations()) animation.currentTime = time;
      const art = document.querySelector('.mural__panel--glazing .mural__art')!;
      const clip = /circle\(([\d.]+)px at ([\d.]+)px ([\d.]+)px\)/.exec(getComputedStyle(art).clipPath);
      const svg = document.querySelector('.board__mural')!.getBoundingClientRect();
      const scale = 900 / svg.width;
      const bad: string[] = [];
      for (const cell of document.querySelectorAll<HTMLElement>('.cell--glazing')) {
        const style = getComputedStyle(cell);
        if (style.color !== 'rgb(255, 255, 255)') continue;
        const r = cell.getBoundingClientRect();
        const corners = [
          [r.left, r.top],
          [r.right, r.top],
          [r.left, r.bottom],
          [r.right, r.bottom],
        ];
        const covered =
          clip === null ||
          corners.every(
            ([x, y]) =>
              Math.hypot(
                (x! - svg.left) * scale - Number(clip[2]),
                (y! - svg.top) * scale - Number(clip[3]),
              ) <= Number(clip[1]),
          );
        if (!covered || style.backgroundColor !== 'rgba(0, 0, 0, 0)')
          bad.push(`t=${String(time)} cell ${cell.dataset.cell ?? ''} ${clip?.[1] ?? 'no clip'}`);
      }
      return bad;
    }, t);
    problems.push(...found);
  }
  expect(problems).toEqual([]);
});
