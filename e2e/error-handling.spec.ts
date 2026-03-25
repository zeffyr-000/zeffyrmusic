import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Error handling', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
  });

  test('unknown artist shows empty state', async ({ page }) => {
    await page.goto('/artist/999999');
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByTestId('empty-state-icon')).toContainText('person_off');
  });

  test('private playlist shows lock empty state', async ({ page }) => {
    await page.goto('/playlist/private-1');
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState.getByTestId('empty-state-icon')).toContainText('lock');
  });
});
