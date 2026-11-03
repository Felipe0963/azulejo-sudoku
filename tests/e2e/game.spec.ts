import { expect, test } from '@playwright/test';
import { BOXES } from '../../src/game';
import { board, cell, fillSolution, openGame, puzzle, solution, type } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('o início mostra o título e os quatro níveis', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Azulejo' })).toBeVisible();
  for (const name of ['Easy', 'Medium', 'Hard', 'Expert']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
});

test('escolher um nível abre o tabuleiro com os números do puzzle', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Easy', exact: true }).click();
  await expect(board(page)).toBeVisible();
  await expect(page.locator('[role="gridcell"]')).toHaveCount(81);
});

test('números do puzzle não mudam e a ação é anunciada', async ({ page }) => {
  await openGame(page);
  const given = puzzle().findIndex((value) => value !== 0);
  await type(page, given, 9 === puzzle()[given] ? 8 : 9);
  await expect(page.getByTestId('announcer')).toHaveText('This number is part of the puzzle.');
  await expect(cell(page, given)).toHaveAccessibleName(new RegExp(`, ${String(puzzle()[given])}, given$`));
});

test('conflito é marcado e anunciado', async ({ page }) => {
  await openGame(page);
  const values = puzzle();
  const row = [...Array(9).keys()];
  const givenInRow0 = row.find((c) => values[c] !== 0)!;
  const emptyInRow0 = row.find((c) => values[c] === 0)!;
  await type(page, emptyInRow0, values[givenInRow0]!);
  await expect(cell(page, emptyInRow0)).toHaveAccessibleName(/conflict/);
  await expect(page.getByTestId('announcer')).toHaveText('Conflict.');
});

test('anotações entram com N e saem ao colocar o número', async ({ page }) => {
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await cell(page, empty).click();
  await page.keyboard.press('n');
  await page.keyboard.press('1');
  await page.keyboard.press('4');
  await expect(cell(page, empty)).toHaveAccessibleName(/notes 1, 4$/);
  await page.keyboard.press('n');
  await page.keyboard.press(String(solution()[empty]));
  await expect(cell(page, empty)).toHaveAccessibleName(new RegExp(`, ${String(solution()[empty])}$`));
});

test('completar um bloco certo vitrifica o painel', async ({ page }) => {
  await openGame(page);
  const box = BOXES.findIndex((cells) => cells.some((c) => puzzle()[c] === 0));
  for (const index of BOXES[box]!) if (puzzle()[index] === 0) await type(page, index, solution()[index]!);
  await expect(page.getByTestId('announcer')).toHaveText(`Panel ${String(box + 1)} glazed.`);
  await expect(cell(page, BOXES[box]![0]!)).toHaveAccessibleName(/glazed$/);
});

test('dica revela uma casa e conta no resultado', async ({ page }) => {
  await openGame(page);
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(page.getByTestId('announcer')).toHaveText(/^Hint: row \d, column \d is \d\.$/);
});

test('desfazer e refazer pelo teclado', async ({ page }) => {
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await type(page, empty, solution()[empty]!);
  await page.keyboard.press('Control+z');
  await expect(cell(page, empty)).toHaveAccessibleName(/empty$/);
  await page.keyboard.press('Control+Shift+z');
  await expect(cell(page, empty)).toHaveAccessibleName(new RegExp(`, ${String(solution()[empty])}$`));
});

test('as setas movem a seleção', async ({ page }) => {
  await openGame(page);
  await cell(page, 0).click();
  await page.keyboard.press('ArrowRight');
  await expect(cell(page, 1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(cell(page, 10)).toBeFocused();
});

test('a pausa cobre o tabuleiro e o cronômetro para', async ({ page }) => {
  await openGame(page);
  const time = page.locator('.game-header__time');
  await expect(time).not.toHaveText(/00:00$/);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  const before = await time.textContent();
  // Uma espera de verdade: ligado, o cronômetro anda a cada 250 ms.
  await page.waitForTimeout(1500);
  await expect(time).toHaveText(before!);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeHidden();
});

test('a partida continua depois de recarregar', async ({ page }) => {
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await type(page, empty, solution()[empty]!);
  await page.reload();
  await expect(cell(page, empty)).toHaveAccessibleName(new RegExp(`, ${String(solution()[empty])}$`));
  await expect(page).toHaveURL(/\?level=easy&seed=7$/);
});

test('o início oferece continuar a partida salva', async ({ page }) => {
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await type(page, empty, solution()[empty]!);
  await page.goto('/');
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(cell(page, empty)).toHaveAccessibleName(new RegExp(`, ${String(solution()[empty])}$`));
  // A URL passa a apontar para esta partida: recarregar continua nela.
  await expect(page).toHaveURL(/\?level=easy&seed=\d+$/);
  await page.reload();
  await expect(cell(page, empty)).toHaveAccessibleName(new RegExp(`, ${String(solution()[empty])}$`));
});

test('resolver o puzzle inteiro mostra a vitória', async ({ page }) => {
  test.slow();
  await openGame(page);
  await fillSolution(page);
  const dialog = page.getByRole('dialog', { name: 'The mural is complete.' });
  await expect(dialog).toBeVisible();
  // O diálogo é modal: a vitória é anunciada na região de status dentro dele.
  await expect(dialog.getByRole('status')).toHaveText('The mural is complete.');
});

test('sem erros no console e sem pedidos para fora do site', async ({ page, baseURL }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith(baseURL!)) problems.push(request.url());
  });
  await openGame(page);
  const empty = puzzle().findIndex((value) => value === 0);
  await type(page, empty, solution()[empty]!);
  expect(problems).toEqual([]);
});
