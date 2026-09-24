import { RenderMode, ServerRoute } from '@angular/ssr';

// Pages that depend on the logged-in user or on client-only state (queue, settings,
// admin tools). They have no SEO value, so rendering them in the browser saves an
// SSR render (and its API round-trips) on every hit.
const CLIENT_ONLY_PATHS = [
  'like',
  'current',
  'settings',
  'my-playlists',
  'my-selection',
  'admin/**',
];

// Every other route is server-rendered on demand (no prerendering), preserving the
// behavior the app had under CommonEngine with `prerender: false`. Parameterized
// routes (help/:page, playlist/:id_playlist, ...) therefore need no prerender params.
export const serverRoutes: ServerRoute[] = [
  ...CLIENT_ONLY_PATHS.map(path => ({ path, renderMode: RenderMode.Client }) as const),
  { path: '**', renderMode: RenderMode.Server },
];
