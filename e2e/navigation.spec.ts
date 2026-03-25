import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('logo navigates to home', async ({ page }) => {
    await page.goto('/help');
    await page.getByTestId('header-logo-link').click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('clicking a top chart card navigates to playlist', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('top-chart-card').first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/top\/\d+/);
  });

  test('help link navigates to help page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('header-help-link').click();
    await expect(page).toHaveURL(/\/help$/);
  });
});
