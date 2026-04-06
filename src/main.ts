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
}).catch(err => console.error(err));
