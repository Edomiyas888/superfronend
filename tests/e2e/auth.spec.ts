import { test, expect } from '@playwright/test';

test.describe('profile auth UI', () => {
  test('sign up form is visible', async ({ page }) => {
    await page.goto('/profile?tab=signup');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  });
});
