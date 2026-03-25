import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Search page — rock', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/search/rock');
  });

  test('displays the search query as heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('rock');
  });

  test('displays artist results', async ({ page }) => {
    const section = page.getByTestId('search-results-artists');
    await expect(section).toBeVisible();
    await expect(section).toContainText('AC/DC');
  });

  test('displays album results', async ({ page }) => {
    const section = page.getByTestId('search-results-albums');
    await expect(section).toBeVisible();
    await expect(section).toContainText('Best of Rock');
  });

  test('displays track results', async ({ page }) => {
    const section = page.getByTestId('search-results-tracks');
    await expect(section).toBeVisible();
    await expect(section).toContainText('Highway to Hell');
  });
});
