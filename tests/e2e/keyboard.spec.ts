import { expect, test } from '@playwright/test';
import { cell, firstEmpty, openGame, shows, solution, type } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('atalhos', () => {
  test('continuam depois de clicar no teclado numérico ou numa ferramenta', async ({ page }) => {
    await openGame(page);
    const empty = firstEmpty();
    const digit = solution()[empty]!;
    const other = digit === 1 ? 2 : 1;
    await cell(page, empty).click();
    await page.getByRole('button', { name: new RegExp(`^Place ${String(other)},`) }).click();
    await expect(cell(page, empty)).toHaveAccessibleName(shows(other));
    await page.keyboard.press(String(digit));
    await expect(cell(page, empty)).toHaveAccessibleName(shows(digit));
    // Desfazer pelo botão até ele ficar desligado: o foco sai do botão, e os atalhos seguem valendo.
    const undo = page.getByRole('button', { name: 'Undo', exact: true });
    await undo.click();
    await undo.click();
    await expect(undo).toBeDisabled();
    await expect(cell(page, empty)).toHaveAccessibleName(/empty$/);
    await page.keyboard.press('Control+Shift+z');
    await expect(cell(page, empty)).toHaveAccessibleName(shows(other));
    await page.keyboard.press('Control+y');
    await expect(cell(page, empty)).toHaveAccessibleName(shows(digit));
    await page.getByRole('button', { name: 'Erase', exact: true }).click();
    await page.keyboard.press(String(digit));
    await expect(cell(page, empty)).toHaveAccessibleName(shows(digit));
    await page.getByRole('button', { name: 'Notes', exact: true }).click();
    await page.keyboard.press('n');
    await expect(page.getByRole('button', { name: 'Notes', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await page.keyboard.press('ArrowLeft');
    await expect(cell(page, empty - 1)).toBeFocused();
  });

  test('apagar com Delete, Backspace e o botão Erase', async ({ page }) => {
    await openGame(page);
    const empty = firstEmpty();
    const digit = solution()[empty]!;
    for (const erase of ['Delete', 'Backspace', 'button']) {
      await type(page, empty, digit);
      await expect(cell(page, empty)).toHaveAccessibleName(shows(digit));
      if (erase === 'button') await page.getByRole('button', { name: 'Erase', exact: true }).click();
      else await page.keyboard.press(erase);
      await expect(cell(page, empty)).toHaveAccessibleName(/empty$/);
    }
  });

  test('o botão Notes usa aria-pressed e a troca de modo é anunciada', async ({ page }) => {
    await openGame(page);
    const notes = page.getByRole('button', { name: 'Notes', exact: true });
    await expect(notes).toHaveAttribute('aria-pressed', 'false');
    await notes.click();
    await expect(notes).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('announcer')).toHaveText('Notes on');
    await page.keyboard.press('n');
    await expect(notes).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('announcer')).toHaveText('Notes off');
  });
});
