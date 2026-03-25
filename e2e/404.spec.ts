import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('404 — Unknown route', () => {
  test('redirects to home', async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/xyz123-unknown-page');
    await expect(page).toHaveURL(/\/$/);
  });
});
