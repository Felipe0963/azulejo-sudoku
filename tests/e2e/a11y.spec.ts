import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { cell, fillSolution, openGame, puzzle, solution, type } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const axe = async (page: import('@playwright/test').Page) =>
  (await new AxeBuilder({ page }).analyze()).violations;

test('início sem violações', async ({ page }) => {
  await page.goto('/');
  expect(await axe(page)).toEqual([]);
});

test('jogo com anotações e conflito sem violações', async ({ page }) => {
  await openGame(page);
  const values = puzzle();
  const empties = [...values.keys()].filter((index) => values[index] === 0);
  await type(page, empties[0]!, solution()[empties[0]!]!);
  // Anotações numa casa vazia.
  await cell(page, empties[1]!).click();
  await page.keyboard.press('n');
  await page.keyboard.press('1');
  await page.keyboard.press('4');
  await page.keyboard.press('n');
  // Conflito: o número de uma casa do puzzle repetido na mesma linha.
  const row = [...Array(9).keys()].map((c) => c + 9 * Math.floor(empties[2]! / 9));
  const given = row.find((c) => values[c] !== 0)!;
  await type(
    page,
    row.find((c) => values[c] === 0 && c !== empties[0] && c !== empties[1])!,
    values[given]!,
  );
  await expect(page.locator('.cell--conflict').first()).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test('vitória sem violações', async ({ page }) => {
  test.slow();
  await openGame(page);
  await fillSolution(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await axe(page)).toEqual([]);
});
