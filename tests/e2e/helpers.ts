import { expect, type Page } from '@playwright/test';
import { pickPuzzle, type Level } from '../../src/game';
import { solve } from '../../src/game/solver';

export const LEVEL: Level = 'easy';
export const SEED = 7;
export const puzzle = () => pickPuzzle(LEVEL, SEED);
export const solution = () => solve(puzzle())!;

export const cell = (page: Page, index: number) => page.locator(`[data-cell="${String(index)}"]`);
export const board = (page: Page) => page.getByRole('grid', { name: 'Sudoku board' });

export async function openGame(page: Page, level: Level = LEVEL, seed = SEED): Promise<void> {
  await page.goto(`/?level=${level}&seed=${String(seed)}`);
  await expect(board(page)).toBeVisible();
}

/** Seleciona uma casa e digita um número pelo teclado. */
export async function type(page: Page, index: number, digit: number): Promise<void> {
  await cell(page, index).click();
  await page.keyboard.press(String(digit));
}

/** Preenche as casas vazias com a solução, exceto as listadas em `skip`. */
export async function fillSolution(page: Page, skip: ReadonlySet<number> = new Set()): Promise<void> {
  const values = puzzle();
  const answer = solution();
  for (let index = 0; index < 81; index++) {
    if (values[index] !== 0 || skip.has(index)) continue;
    await type(page, index, answer[index]!);
  }
}
