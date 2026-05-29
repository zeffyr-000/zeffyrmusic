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
    integrations: [Sentry.browserTracingIntegration(), Sentry.httpClientIntegration()],
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
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
      // HttpErrorResponse instances captured by the Angular ErrorHandler are
      // duplicates: errorInterceptor already reports them via LoggingService with
      // a sanitized URL and proper context. Drop the raw object captures here.
      const exceptionType = event.exception?.values?.[0]?.type;
      if (exceptionType === 'HttpErrorResponse') {
        return null;
      }
      // Non-actionable Sentry fallback: SentryErrorHandler emits this string when
      // a non-Error value is thrown (e.g. `throw null`, `throw {}`). No stack trace
      // is recoverable, so the event provides no debugging value.
      if (
        exceptionType === 'Error' &&
        event.exception?.values?.[0]?.value === 'Handled unknown error'
      ) {
        return null;
      }
      // Drop non-actionable third-party / environment errors
      const message =
        event.exception?.values?.[0]?.value ??
        (typeof event.message === 'string' ? event.message : '');
      if (
        message.includes('Java object is gone') ||
        // Chunk load failures after deployments — non-actionable, covered by withNavigationErrorHandler
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        // Transient network loss — handled by errorInterceptor (status 0 shows connection-lost toast).
        // Sentry serializes this as either the bare message or prefixed with the error type.
        message === 'Failed to fetch' ||
        message === 'TypeError: Failed to fetch' ||
        message.includes('Access is denied for this document') ||
        // Fullscreen denial — handled silently in ControlBarComponent.goFullscreen()
        message.includes('not granted') ||
        // iOS Safari WebKit fullscreen fallback — third-party / unsupported path
        message.includes('webkitEnterFullscreen') ||
        message.includes("document.querySelector('video').src")
      ) {
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
