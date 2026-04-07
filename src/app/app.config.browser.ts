import { ApplicationConfig, ErrorHandler, importProvidersFrom, Provider } from '@angular/core';
import type * as SentryAngular from '@sentry/angular';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';
import { appConfig } from './app.config';
import { SENTRY_API } from './tokens';
import { environment } from '../environments/environment';

type SentryModule = typeof SentryAngular;

const gaTrackingCode = environment.GA_TRACKING_ID;

function sentryProviders(sentry: SentryModule): Provider[] {
  return [
    { provide: ErrorHandler, useValue: sentry.createErrorHandler({ showDialog: false }) },
    { provide: SENTRY_API, useValue: sentry },
  ];
}

/** Client-only config with Google Analytics and Hydration */
export function createBrowserConfig(sentry?: SentryModule): ApplicationConfig {
  return {
    providers: [
      ...appConfig.providers,
      ...(sentry ? sentryProviders(sentry) : []),
      provideClientHydration(
        withEventReplay(),
        // Exclude POST requests from transfer cache to avoid caching non-idempotent operations
        // (e.g., form submits, mutations, analytics/auth payloads)
        withHttpTransferCacheOptions({ includePostRequests: false })
      ),
      importProvidersFrom(
        // Disable automatic page_view on gtag config — components send pageView() manually
        // after setting the correct document title (prevents ghost "Zeffyrmusic" titles in GA)
        NgxGoogleAnalyticsModule.forRoot(gaTrackingCode, [
          { command: 'config', values: [gaTrackingCode, { send_page_view: false }] },
        ])
      ),
    ],
  };
}

/**
 * Standalone PWA config - NO hydration to avoid mismatch with HashLocationStrategy
 * SSR generates HTML with PathLocationStrategy, but standalone PWA uses HashLocationStrategy
 */
export function createBrowserConfigStandalone(sentry?: SentryModule): ApplicationConfig {
  return {
    providers: [
      ...appConfig.providers,
      ...(sentry ? sentryProviders(sentry) : []),
      // No provideClientHydration() - fresh bootstrap instead of hydration
      importProvidersFrom(
        // Disable automatic page_view — same reason as browserConfig above
        NgxGoogleAnalyticsModule.forRoot(gaTrackingCode, [
          { command: 'config', values: [gaTrackingCode, { send_page_view: false }] },
        ])
      ),
    ],
  };
}
