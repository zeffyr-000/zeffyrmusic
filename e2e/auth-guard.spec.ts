import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Auth guard — unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('redirects /settings to home', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/$/);
  });

  test('redirects /my-playlists to home', async ({ page }) => {
    await page.goto('/my-playlists');
    await expect(page).toHaveURL(/\/$/);
  });

  test('redirects /like to home', async ({ page }) => {
    await page.goto('/like');
    await expect(page).toHaveURL(/\/$/);
  });
});
