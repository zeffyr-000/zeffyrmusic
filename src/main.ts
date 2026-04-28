import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from './environments/environment';
import {
  LocationStrategy,
  HashLocationStrategy,
  PathLocationStrategy,
  APP_BASE_HREF,
} from '@angular/common';
import { createBrowserConfig, createBrowserConfigStandalone } from './app/app.config.browser';
import { AppComponent } from './app/app.component';
import { InitService } from './app/services/init.service';
import { PlayerService } from './app/services/player.service';
import { sanitizeUrl } from './app/utils';
import { clearChunkRetryFlag } from './app/routing/chunk-error-handler';
import type * as SentryAngular from '@sentry/angular';

let Sentry: typeof SentryAngular | undefined;

if (environment.SENTRY_DSN) {
  Sentry = await import('@sentry/angular');
  Sentry.init({
    dsn: environment.SENTRY_DSN,
    environment: environment.SENTRY_ENVIRONMENT,
    release: environment.SENTRY_RELEASE || undefined,
    // browserTracingIntegration powers the Performance dashboard (pageload/navigation
    // transactions + Web Vitals). httpClientIntegration is intentionally NOT enabled —
    // the errorInterceptor already reports HTTP errors with richer context (sanitized URL,
    // method, status_code) and avoids duplicate events.
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    // The PHP/Jelix backend has no Sentry SDK to correlate distributed traces, so propagating
    // sentry-trace/baggage headers to data.zeffyrmusic.com is wasted and may trip CORS.
    tracePropagationTargets: [],
    sendDefaultPii: false,
    // Restrict captured errors to our own bundle — anything originating from extensions,
    // injected third-party scripts, or YouTube iframes is dropped before reaching Sentry.
    allowUrls: [/zeffyrmusic\.com/iu],
    denyUrls: [
      /^chrome-extension:\/\//iu,
      /^moz-extension:\/\//iu,
      /^safari(-web)?-extension:\/\//iu,
      /googletagmanager\.com/iu,
      /google-analytics\.com/iu,
      /youtube\.com\/(embed|iframe_api|s\/player)/iu,
    ],
    // Patterns observed in production over 3 weeks — non-actionable noise we want to drop
    // at the SDK level (cheaper than Sentry inbound filters and works offline).
    ignoreErrors: [
      // Safari fetch network failure
      'Load failed',
      // Firefox fetch network failure
      'NetworkError when attempting to fetch resource.',
      // User navigation / tab close mid-request
      'AbortError: The user aborted a request.',
      'signal is aborted without reason',
      /^AbortError/u,
      // Stale chunk errors — already handled by withNavigationErrorHandler (auto-reload once)
      /error loading dynamically imported module/u,
      // Browser extension globals leaking into our context
      'window.nativeSecondaryActionHit is not a function',
      'Invalid call to runtime.sendMessage(). Tab not found.',
      // Old Safari without Fullscreen API
      /requestFullscreen is not a function/u,
      // YouTube iframe postMessage origin mismatch (external)
      'invalid origin',
      // Legacy filters retained from the previous beforeSend
      'Java object is gone',
      'Failed to fetch dynamically imported module',
      'Importing a module script failed',
      'Failed to fetch',
      'TypeError: Failed to fetch',
      'Access is denied for this document',
    ],
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data?.['url']) {
        breadcrumb.data['url'] = sanitizeUrl(String(breadcrumb.data['url']));
      }
      return breadcrumb;
    },
    beforeSend(event) {
      if (event.request?.url) {
        event.request.url = sanitizeUrl(event.request.url);
      }
      // Drop only the well-known cross-origin "Script error." reports when they arrive
      // with no stacktrace frames. These are produced by browsers for errors thrown by
      // scripts loaded from another origin (extensions, ad/tracking iframes) without
      // proper CORS headers — they slip past denyUrls because there is no script URL to
      // match. We intentionally do NOT drop every frame-less exception, since some real
      // runtime errors (Safari/iOS, minified bundles in rare cases) can also lack frames.
      const exception = event.exception?.values?.[0];
      const frames = exception?.stacktrace?.frames;
      const message = exception?.value?.trim();
      const hasNoFrames = !frames || frames.length === 0;
      const isCrossOriginScriptError =
        message === 'Script error.' ||
        message === 'Script error' ||
        message === 'Javascript error: Script error. on line 0';
      if (exception && hasNoFrames && isCrossOriginScriptError) {
        return null;
      }
      return event;
    },
  });
}

if (environment.production) {
  enableProdMode();
}

// Detect standalone PWA mode (iOS home screen, Samsung Browser app mode)
const isStandalonePwa =
  ('standalone' in globalThis.navigator &&
    (globalThis.navigator as Navigator & { standalone: boolean }).standalone) ||
  globalThis.matchMedia('(display-mode: standalone)').matches;

// Use different config for standalone PWA:
// - No hydration (SSR uses PathLocationStrategy, but standalone needs HashLocationStrategy)
// - Fresh bootstrap avoids hydration mismatch that causes app to become unresponsive
const config = isStandalonePwa
  ? createBrowserConfigStandalone(Sentry)
  : createBrowserConfig(Sentry);

bootstrapApplication(AppComponent, {
  providers: [
    ...config.providers,
    { provide: APP_BASE_HREF, useValue: '/' },
    {
      provide: LocationStrategy,
      useClass: isStandalonePwa ? HashLocationStrategy : PathLocationStrategy,
    },
    InitService,
    PlayerService,
  ],
})
  .then(() => clearChunkRetryFlag())
  .catch(err => console.error(err));
