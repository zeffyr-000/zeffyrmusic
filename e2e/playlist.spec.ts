import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Playlist page — La Hit List', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/top/1');
  });

  test('has the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/La Hit List/);
  });

  test('displays the playlist image', async ({ page }) => {
    await expect(page.getByTestId('playlist-image')).toBeVisible();
  });

  test('displays the playlist title', async ({ page }) => {
    const heading = page.getByTestId('playlist-title');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('La Hit List');
  });

  test('displays the playlist description', async ({ page }) => {
    const description = page.getByTestId('playlist-description');
    await expect(description).toBeVisible();
    await expect(description).toContainText('Un condensé des plus gros hits du moment.');
  });

  test('displays track items', async ({ page }) => {
    const tracks = page.getByTestId('track-item');
    await expect(tracks.first()).toBeVisible();
    await expect(tracks.first()).toContainText('Hit Song 1');
  });
});
