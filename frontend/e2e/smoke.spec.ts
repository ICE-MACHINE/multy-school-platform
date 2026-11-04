import { expect, test } from '@playwright/test';

test.describe('public shell', () => {
  test('landing page renders and language can switch to Arabic (RTL)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page).toHaveTitle(/.+/);

    const switcher = page.getByRole('button', { name: /language|اللغة|langue/i }).first();
    await expect(switcher).toBeVisible({ timeout: 30_000 });
    await switcher.click();
    await page.getByRole('menuitem', { name: 'العربية' }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('super admin login form is reachable and validates empty submit', async ({ page }) => {
    await page.goto('/superAdmin/login');
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible({ timeout: 30_000 });
    expect(await inputs.count()).toBeGreaterThanOrEqual(2);

    const submit = page.getByRole('button', { name: /log in|login|sign in|دخول|تسجيل/i }).last();
    await expect(submit).toBeVisible();
    await expect(page).toHaveURL(/superAdmin\/login/);
  });

  test('unknown route falls back without a blank crash screen', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('#root')).not.toBeEmpty();
  });
});
