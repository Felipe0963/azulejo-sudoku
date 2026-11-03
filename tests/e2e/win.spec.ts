import { expect, test } from '@playwright/test';
import { cell, fillSolution, firstEmpty, focusInBoard, openGame, shows, solution } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('vitória', () => {
  test('a dica conta no resultado e o recorde é salvo', async ({ page }) => {
    test.slow();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azulejo:best-times', JSON.stringify({ easy: 3_599_000 }));
    });
    await openGame(page);
    const first = firstEmpty();
    await page.getByRole('button', { name: 'Hint', exact: true }).click();
    await expect(cell(page, first)).toHaveAccessibleName(shows(solution()[first]!));
    await fillSolution(page, new Set([first]));
    const dialog = page.getByRole('dialog', { name: 'The mural is complete.' });
    await expect(dialog).toBeVisible();
    const result = (term: string) => dialog.locator(`dt:text-is("${term}") + dd`);
    await expect(result('Hints')).toHaveText('1');
    await expect(dialog.getByText('New best time')).toBeVisible();
    const time = (await result('Time').textContent())!;
    expect(time).not.toBe('59:59');
    await expect(result('Best time')).toHaveText(time);
    const stored = await page.evaluate(() => localStorage.getItem('azulejo:best-times'));
    expect((JSON.parse(stored!) as { easy: number }).easy).toBeLessThan(3_599_000);
  });

  test('Play again começa outra partida com o foco no tabuleiro', async ({ page }) => {
    test.slow();
    await openGame(page);
    await fillSolution(page);
    await page.getByRole('button', { name: 'Play again' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(focusInBoard(page)).toHaveCount(1);
    await expect(page).toHaveURL(/\?level=easy&seed=\d+$/);
    await page.keyboard.press('ArrowDown');
    await expect(cell(page, 9)).toBeFocused();
  });
});
