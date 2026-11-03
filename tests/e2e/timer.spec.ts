import { expect, test } from '@playwright/test';
import { openGame, setHidden } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('cronômetro', () => {
  test('para com a aba oculta e não volta sozinho com a pausa aberta', async ({ page }) => {
    await openGame(page);
    const time = page.locator('.game-header__time');
    await expect(time).not.toHaveText(/00:00$/);
    await setHidden(page, true);
    const hidden = await time.textContent();
    await page.waitForTimeout(1500);
    await expect(time).toHaveText(hidden!);
    // Pausar com a aba oculta: a volta da aba não pode retomar o cronômetro.
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await setHidden(page, false);
    await page.waitForTimeout(1500);
    await expect(time).toHaveText(hidden!);
    await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await expect(time).not.toHaveText(hidden!);
  });

  test('com a aba oculta desde a abertura, só começa a contar quando ela aparece', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    });
    await openGame(page);
    const time = page.locator('.game-header__time');
    await page.waitForTimeout(1500);
    await expect(time).toHaveText(/00:00$/);
    await setHidden(page, false);
    await expect(time).not.toHaveText(/00:00$/);
  });
});
