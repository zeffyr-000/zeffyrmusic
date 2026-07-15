import { RenderMode, ServerRoute } from '@angular/ssr';

// Every route is server-rendered on demand (no prerendering), preserving the
// behavior the app had under CommonEngine with `prerender: false`. Parameterized
// routes (help/:page, reset_pass/:id_perso/:key) therefore need no prerender params.
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Server }];
