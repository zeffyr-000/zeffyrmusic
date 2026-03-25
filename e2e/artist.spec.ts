import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Artist page — Johnny Hallyday', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/artist/502');
  });

  test('displays the artist name', async ({ page }) => {
    const heading = page.getByTestId('artist-name');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Johnny Hallyday');
  });

  test('displays the artist image', async ({ page }) => {
    const image = page.getByTestId('artist-image');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', /deezer/);
  });
});
