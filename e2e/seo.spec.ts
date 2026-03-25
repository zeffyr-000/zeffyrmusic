import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('SEO', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('home page has meta description', async ({ page }) => {
    await page.goto('/');
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
  });

  test('artist page title contains artist name', async ({ page }) => {
    await page.goto('/artist/502');
    await expect(page).toHaveTitle(/Johnny Hallyday/);
  });

  test('playlist page title contains playlist name', async ({ page }) => {
    await page.goto('/top/1');
    await expect(page).toHaveTitle(/La Hit List/);
  });
});
