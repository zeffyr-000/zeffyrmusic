import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixturesDir = resolve(__dirname, '../fixtures');

function loadFixture(name: string): string {
  return readFileSync(resolve(fixturesDir, name), 'utf-8');
}

const fixtureMap: Record<string, string> = {
  ping: 'ping.json',
  home_init: 'home-init.json',
  'json/artist/502': 'artist-502.json',
  'json/playlist/1': 'playlist-1.json',
  'json/playlist/private-1': 'playlist-private.json',
  'json/top/1': 'playlist-1.json',
  'fullsearch1/': 'search-rock-1.json',
  'fullsearch2/': 'search-rock-2.json',
};

/**
 * Intercept all API calls and serve JSON fixtures.
 * Also strips Angular TransferState from SSR HTML so the client
 * re-fetches data through the mocked routes instead of using
 * server-side cached responses.
 *
 * Call this in `beforeEach` to isolate tests from the backend.
 */
export async function mockApiRoutes(page: Page): Promise<void> {
  const fixtures = Object.fromEntries(
    Object.entries(fixtureMap).map(([key, file]) => [key, loadFixture(file)])
  );

  await page.route('**', async route => {
    const url = route.request().url();

    // Serve fixture for matching API calls
    if (url.includes('/api/')) {
      for (const [pattern, body] of Object.entries(fixtures)) {
        if (url.includes(`/api/${pattern}`)) {
          return route.fulfill({ status: 200, contentType: 'application/json', body });
        }
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }

    // Strip TransferState from SSR HTML to force client-side re-fetch
    if (route.request().isNavigationRequest()) {
      const response = await route.fetch();
      let body = await response.text();
      body = body.replace(/<script id="ng-state"[^>]*>[\s\S]*?<\/script>/g, '');
      return route.fulfill({ response, body });
    }

    // Pass through static assets (JS, CSS, images, fonts)
    return route.continue();
  });
}
