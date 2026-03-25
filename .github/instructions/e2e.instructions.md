---
applyTo: 'e2e/**/*.ts'
---

# E2E Testing — Playwright

## Framework & Configuration

- **Playwright** with `@playwright/test` — config in `playwright.config.ts`
- **Chromium only** in CI — multi-browser locally if needed
- **Mocked API** — all tests run without a backend; fixtures in `e2e/fixtures/`
- **SSR server** — `webServer` in config starts `node dist/server/server.mjs` on port 4000

## Conventions

### Selectors

Use `data-testid` attributes exclusively for E2E selectors:

```typescript
// ✅ Resilient — survives CSS/HTML refactoring
page.getByTestId('search-input');
page.getByTestId('artist-name');

// ❌ Fragile — breaks when class/id changes
page.locator('#input-search-header');
page.locator('.artist-title h1');
```

When adding a new tested element, add `data-testid="descriptive-name"` in the Angular template.

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { mockApiRoutes } from './helpers/mock-api';

test.describe('Feature name', () => {
  test.beforeEach(async ({ page }) => {
    await mockApiRoutes(page);
    await page.goto('/route');
  });

  test('describes expected behavior', async ({ page }) => {
    await expect(page.getByTestId('element')).toBeVisible();
  });
});
```

### File Organization

```
e2e/
├── fixtures/              # JSON API response fixtures
│   ├── ping.json
│   ├── home-init.json
│   ├── artist-502.json
│   ├── playlist-1.json
│   ├── playlist-private.json
│   ├── search-rock-1.json
│   └── search-rock-2.json
├── helpers/
│   └── mock-api.ts        # mockApiRoutes(page) — intercepts all API calls + strips TransferState
├── home.spec.ts
├── artist.spec.ts
├── playlist.spec.ts
├── search.spec.ts
├── auth-guard.spec.ts
├── navigation.spec.ts
├── help.spec.ts
├── seo.spec.ts
├── error-handling.spec.ts
└── 404.spec.ts
```

### API Mocking

All API calls are intercepted at **two levels** to fully isolate tests from the real backend:

#### 1. SSR-side: Staging environment + Express API fallback

E2E tests use a dedicated **e2e** build configuration (`environment.e2e.ts`) where
`URL_SERVER` is **relative** (`/api/`) and `production` is `false`. During SSR, Angular's
`HttpClient` makes requests to `http://localhost:4000/api/...`. An Express fallback
route in `server.ts` (registered when `environment.URL_SERVER.startsWith('/')` is `true`)
catches these and returns `{}` — preventing SSR from contacting any real backend.

When `URL_SERVER` is an absolute URL (`startsWith('/')` is `false` — production and
staging builds), this fallback route is **not** registered.

#### 2. Browser-side: Playwright route mocking (`mock-api.ts`)

`mockApiRoutes(page)` in `e2e/helpers/mock-api.ts` uses a single `page.route('**', ...)` handler that:

1. **API requests** (`/api/...`): Matches against the `fixtureMap` and serves JSON fixtures
2. **Navigation requests**: Fetches from the SSR server, then **strips `<script id="ng-state">`** (Angular TransferState) to force client-side re-fetch through mocked routes
3. **Other requests** (JS, CSS, images): Passes through to the server

> **Why strip TransferState?** SSR receives `{}` from the Express fallback.
> Angular embeds this empty data in a TransferState script. Stripping it ensures
> the client always re-fetches through Playwright mocks with full fixture data.

To add a new fixture:

1. Create `e2e/fixtures/my-feature.json` with the expected API response (snake_case, matching backend format)
2. Add the route pattern in the `fixtureMap` in `e2e/helpers/mock-api.ts`

### Adding a New Test

1. Create `e2e/my-feature.spec.ts`
2. Import and call `mockApiRoutes(page)` in `beforeEach`
3. Add any needed `data-testid` attributes in Angular templates
4. Add any needed fixture files in `e2e/fixtures/`
5. Run: `npm run e2e` (all tests) or `npx playwright test my-feature` (single file)

## Rules

- **No `waitForTimeout()`** — use Playwright's auto-wait (`toBeVisible`, `toHaveText`, etc.)
- **No real API calls** — e2e build uses relative `/api/` URLs (SSR fallback returns `{}`), browser is mocked via fixtures
- **Tests must be independent** — no shared state, no execution order dependency
- **No hardcoded dynamic data** — assert structure/presence, not exact counts that may change
- **English only** for test descriptions and comments

## Commands

```bash
npm run e2e              # Run all E2E tests (headless)
npm run e2e:ui           # Interactive Playwright UI mode
npx playwright test home # Run a single test file
npx playwright show-report # View HTML report after a run
```
