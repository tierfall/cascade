import { expect, test } from '@playwright/test';

test.describe('Home page', () => {
  test('renders Cascade landing with tier ramp and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Cascade' })).toBeVisible();
    await expect(page.getByLabel('tier ramp preview')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  });

  test('renders all five tier badges', async ({ page }) => {
    await page.goto('/');
    for (let tier = 0; tier <= 4; tier += 1) {
      await expect(page.getByText(`Tier ${tier}`)).toBeVisible();
    }
  });

  test('serves dark mode by default (background is near-black)', async ({ page }) => {
    await page.goto('/');
    const bg = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor);
    // background-dark token is #0a0a0a -> rgb(10, 10, 10)
    expect(bg).toMatch(/rgb\(\s*10,\s*10,\s*10\s*\)/);
  });
});
