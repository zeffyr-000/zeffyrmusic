import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('404 — Unknown route', () => {
  test('displays the not-found page', async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/xyz123-unknown-page');
    await expect(page.getByTestId('not-found')).toBeVisible();
    await expect(page.getByTestId('attempted-url')).toContainText('/xyz123-unknown-page');
  });

  test('has a link back to home', async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/xyz123-unknown-page');
    const backLink = page.getByTestId('back-home-link');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
