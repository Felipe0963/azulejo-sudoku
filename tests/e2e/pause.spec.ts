import { expect, test } from '@playwright/test';
import { cell, firstEmpty, focusInBoard, openGame, shows, solution } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('pausa', () => {
  test('bloqueia o jogo e prende o foco no Resume', async ({ page }) => {
    await openGame(page);
    const empty = firstEmpty();
    await cell(page, empty).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const resume = page.getByRole('button', { name: 'Resume', exact: true });
    await expect(resume).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(resume).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(resume).toBeFocused();
    await page.keyboard.press('1');
    await page.keyboard.press('Control+z');
    // O resto da tela é inerte (fora do leitor de tela e do foco), e nem um clique forçado faz efeito.
    for (const part of ['.game-header', '.board', '.panel'])
      await expect(page.locator(part)).toHaveAttribute('inert', '');
    await page.locator('.toolbar .tool', { hasText: 'Hint' }).click({ force: true });
    await page.locator('.number-key').first().click({ force: true });
    await expect(cell(page, empty)).toHaveAttribute('aria-label', /empty$/);
    await expect(page.getByTestId('announcer')).toHaveText('');
  });

  test('depois do Resume, o foco volta para a casa selecionada e os atalhos funcionam', async ({ page }) => {
    await openGame(page);
    const empty = firstEmpty();
    await cell(page, empty).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await expect(cell(page, empty)).toBeFocused();
    await page.keyboard.press(String(solution()[empty]));
    await expect(cell(page, empty)).toHaveAccessibleName(shows(solution()[empty]!));
  });

  test('depois do Resume sem casa selecionada, o foco vai para o tabuleiro', async ({ page }) => {
    await openGame(page);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    // Focar o tabuleiro seleciona a primeira casa (uma só parada de Tab na grade).
    await expect(focusInBoard(page)).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, 1)).toBeFocused();
  });
});
