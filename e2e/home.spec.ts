import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/');
  });

  test('has the correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/ZeffyrMusic/);
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.getByTestId('search-input')).toBeVisible();
  });

  test('displays top chart cards', async ({ page }) => {
    const cards = page.getByTestId('top-chart-card');
    await expect(cards.first()).toBeVisible();
  });

  test('displays album cards', async ({ page }) => {
    const albumSection = page.getByTestId('album-section');
    await expect(albumSection).toBeVisible();
    await expect(albumSection.locator('.card')).not.toHaveCount(0);
  });
});
