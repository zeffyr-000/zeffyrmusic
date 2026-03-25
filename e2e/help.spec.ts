import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Help page', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/help');
  });

  test('has the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Annuaire|Astuces|Help/i);
  });

  test('displays help categories with cards', async ({ page }) => {
    const cards = page.getByTestId('help-card');
    await expect(cards.first()).toBeVisible();
  });
});
