import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home shows Popular and Featured headings', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Popular' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Featured' })).toBeVisible();
  });

  test('profile page loads', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  });

  test('bottom nav links to home and profile', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Profile' }).click();
    await expect(page).toHaveURL(/\/profile/);
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
