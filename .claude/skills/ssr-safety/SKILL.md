---
name: ssr-safety
description: Angular SSR rules for Zeffyr Music — AngularNodeAppEngine allowedHosts (silent CSR fallback if missing), browser-API safety via withSsrSafety()/isPlatformBrowser/globalThis.crypto, and PM2/Node deployment. Use when editing src/server.ts, server config, stores, or utils, or when debugging SSR/hydration.
---

# SSR Instructions

## Architecture

```
Browser Request
  → Express server (src/server.ts, port 4000)
    → AngularNodeAppEngine.handle(req) (@angular/ssr/node)
      → server routes (src/app/app.routes.server.ts, RenderMode.Server)
        → bootstrapApplication (src/main.server.ts)
          → AppComponent with server config (src/app/app.config.server.ts)
            → provideServerRendering(withRoutes(serverRoutes)) + provideClientHydration(withEventReplay())
    → writeResponseToNodeResponse() → HTML response (hydrated on client)
```

Since Angular v22 `CommonEngine` is deprecated; the app uses `AngularNodeAppEngine` +
`createNodeRequestHandler` (exported as `reqHandler`) + `writeResponseToNodeResponse`.
This requires `"outputMode": "server"` in `angular.json` and a server routes config so
the app-engine manifest gets wired into `dist/server/server.mjs` (otherwise the engine
throws "Angular app engine manifest is not set" at startup).

Key files:

| File                           | Role                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `src/server.ts`                | Express server, AngularNodeAppEngine setup, static files    |
| `src/app/app.routes.server.ts` | Server render modes (all `RenderMode.Server`, no prerender) |
| `src/main.server.ts`           | Server bootstrap entry point                                |
| `src/app/app.config.server.ts` | Server providers (SSR routes + hydration + APP_BASE_HREF)   |
| `src/app/app.config.ts`        | Shared app config (zoneless, router, HTTP)                  |

Per-request SSR context uses Angular's native `@angular/core` tokens, not custom ones:
`REQUEST` (web `Request` — `request.headers.get('cookie')` in `httpConfigInterceptor`) and
`RESPONSE_INIT` (`responseInit.status = 404` in `not-found.component.ts`). The engine
populates these itself — do not add per-request providers in `server.ts`.

## Critical: allowedHosts (SSRF Protection)

`AngularNodeAppEngine` validates request hostnames via `allowedHosts`.
**If a hostname is missing, SSR silently falls back to CSR** — no visible error in the browser.
(A separate hostname-guard middleware in `server.ts` also destroys sockets from unknown hosts.)

```typescript
// src/server.ts
const angularApp = new AngularNodeAppEngine({
  allowedHosts: [
    'www.zeffyrmusic.com',
    'zeffyrmusic.com',
    'data.zeffyrmusic.com',
    '146.59.155.20', // Server public IP
    '127.0.0.1',
    'localhost',
  ],
});
```

### Rules

- **Always add new domains/IPs** to `allowedHosts` when adding proxy rules or changing infra
- If SSR stops working after an `@angular/ssr` upgrade, check PM2 logs for: `ERROR: URL with hostname "..." is not allowed`
- PM2 logs: `sudo pm2 logs --lines 50`
- Test SSR locally: `npm run serve:ssr:zeffyrmusic` then `curl -s http://localhost:4000 | head -50` — look for rendered HTML, not empty `<app-root>`

## Browser API Safety

Node.js does not provide browser DOM APIs such as `window`, `document`, or `localStorage`. While Node 22+ exposes a global `navigator`, it is not a browser `navigator` and must not be relied on for browser behavior during SSR. `globalThis.crypto` is fully available in Node ≥ 22 and requires no fallback. Code that runs during SSR must not access browser-only globals directly.

### In Stores: use `withSsrSafety()`

```typescript
// ✅ Correct — SSR-safe access
export const MyStore = signalStore(
  { providedIn: 'root' },
  withSsrSafety(),
  withState(initialState),
  withMethods(store => ({
    init(): void {
      if (store.isBrowser()) {
        // Safe to use browser APIs here
      }
    },
  }))
);
```

### In Components: use `isPlatformBrowser`

```typescript
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

private readonly platformId = inject(PLATFORM_ID);

ngOnInit(): void {
  if (isPlatformBrowser(this.platformId)) {
    // Browser-only code
  }
}
```

### In Utility Functions: use `globalThis.crypto` directly

`globalThis.crypto` is available in Node ≥ 22 and all modern browsers. No fallback needed.

```typescript
// ✅ Correct — crypto available in Node 22+ and browsers
function getRandomIntInclusive(max: number, buffer: Uint32Array): number {
  const range = max + 1;
  const limit = Math.floor(0x100000000 / range) * range - 1;
  while (true) {
    globalThis.crypto.getRandomValues(buffer);
    if (buffer[0] <= limit) {
      return buffer[0] % range;
    }
  }
}

// ✅ Correct — globalThis.crypto.randomUUID() available in Node 22+
const id = globalThis.crypto.randomUUID();
```

### Forbidden in SSR Context

```typescript
// ❌ Browser-only globals — unavailable or unreliable in SSR
window.scrollTo(0, 0);
document.getElementById('el');
localStorage.getItem('key');
navigator.userAgent; // Exists in Node 22+ but not a browser navigator
```

## Production Deployment Checklist

1. **Node version**: Must be ≥ 22.x (see `package.json` `engines` field).
2. **Build**: `npm run build` — produces `dist/zeffyr-music/server/` and `dist/zeffyr-music/browser/`
3. **PM2 restart**: After Node upgrade, `sudo pm2 kill` then restart — PM2 daemon caches the old Node binary
4. **Verify SSR**:
   - `curl -s https://www.zeffyrmusic.com | sed -n '/<app-root/,/<\/app-root>/p'`
   - **CSR fallback (broken):** `<app-root></app-root>`
   - **SSR rendered (expected):** `<app-root><app-header>...`
5. **Check logs**: `sudo pm2 logs --lines 50` — look for `allowedHosts` errors or crash traces

## SSR Debugging

| Symptom                                             | Likely Cause                                      | Fix                                                                                  |
| --------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Page loads but no SSR content (empty `<app-root>`)  | Missing hostname in `allowedHosts`                | Add hostname to `AngularNodeAppEngine` config in `server.ts`                         |
| `Angular app engine manifest is not set` at startup | `outputMode: "server"` missing / no server routes | Ensure `angular.json` has `"outputMode": "server"` and `app.routes.server.ts` exists |
| `ReferenceError: window is not defined`             | Direct browser API access in SSR                  | Guard with `isPlatformBrowser` or `isBrowser()`                                      |
| SSR works locally but not in production             | PM2 still running old Node binary                 | `sudo pm2 kill` then restart                                                         |
| `allowedHosts` error in PM2 logs                    | New domain/IP not in config                       | Add domain or IP to `allowedHosts` array in `server.ts`                              |
