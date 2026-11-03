import { expect, test } from '@playwright/test';
import { SEED, openGame } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test.describe('URL e partida salva', () => {
  test('escolher um nível sorteia outra semente e a URL mostra a partida atual', async ({ page }) => {
    await openGame(page);
    const seeds: string[] = [];
    for (let round = 0; round < 2; round++) {
      await page.getByRole('button', { name: 'Change level' }).click();
      await expect(page).toHaveURL(/\/$/);
      await page.getByRole('button', { name: 'Medium', exact: true }).click();
      await expect(page).toHaveURL(/\?level=medium&seed=\d+$/);
      seeds.push(new URL(page.url()).searchParams.get('seed')!);
    }
    expect(seeds).not.toContain(String(SEED));
    expect(seeds[0]).not.toBe(seeds[1]);
  });

  test('partida salva corrompida é descartada', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('azulejo:game', '{"version":1,"level":"easy"');
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Azulejo' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue/ })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('azulejo:game'))).toBeNull();
  });
});
