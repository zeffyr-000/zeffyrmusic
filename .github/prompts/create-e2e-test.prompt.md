# Create E2E Test

Create a Playwright E2E test following project conventions.

## Requirements

- Use `@playwright/test` (`test`, `expect`)
- Use `mockApiRoutes(page)` from `./helpers/mock-api` in `beforeEach`
- Use `data-testid` selectors exclusively — never CSS classes or IDs
- Add `data-testid` attributes to Angular templates for new tested elements
- Place fixtures in `e2e/fixtures/` as JSON files

## Template

```typescript
import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Feature name', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/route');
  });

  test('describes expected behavior', async ({ page }) => {
    await expect(page.getByTestId('element-name')).toBeVisible();
  });

  test('handles empty state', async ({ page }) => {
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('navigates to detail page', async ({ page }) => {
    await page.getByTestId('item-card').first().click();
    await expect(page).toHaveURL(/\/expected-route/);
  });
});
```

## Rules

- One `test.describe` per feature or page
- Descriptive test names: "displays artist name", not "test1"
- Always mock API routes — tests must run without a real backend
- Use `page.getByTestId()` exclusively — never `page.locator('.class')`, `page.getByRole()`, or `page.getByText()`
- Assert visibility with `toBeVisible()`, URLs with `toHaveURL()`, titles with `toHaveTitle()`
- For SSR validation: check that server-rendered content appears before hydration
- Keep tests independent — no shared state between tests
