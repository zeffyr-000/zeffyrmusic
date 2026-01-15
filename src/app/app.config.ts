import {
  ApplicationConfig,
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideShareButtonsOptions, withConfig } from 'ngx-sharebuttons';
import { shareIcons } from 'ngx-sharebuttons/icons';
import { httpConfigInterceptor } from './interceptor/httpConfigInterceptor';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { routes } from './app.routes';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { TranslocoHttpLoader } from './transloco.loader';
import { environment } from '../environments/environment';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  Title,
  Meta,
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withFetch(), withInterceptors([httpConfigInterceptor])),
    provideShareButtonsOptions(
      shareIcons(),
      withConfig({
        include: ['facebook', 'x', 'whatsapp', 'copy'],
      })
    ),
    provideTransloco({
      config: {
        availableLangs: environment.availableLangs,
        defaultLang: environment.lang,
        fallbackLang: environment.lang,
        prodMode: environment.production,
        reRenderOnLangChange: true,
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoMessageformat(),
    NgbActiveModal,
    Title,
    Meta,
  ],
};

/** Client-only config with Google Analytics and Hydration */
export const browserConfig: ApplicationConfig = {
  providers: [
    ...appConfig.providers,
    provideClientHydration(
      withEventReplay(),
      // Exclude POST requests from transfer cache to avoid caching non-idempotent operations
      // (e.g., form submits, mutations, analytics/auth payloads)
      withHttpTransferCacheOptions({ includePostRequests: false })
    ),
    importProvidersFrom(
      NgxGoogleAnalyticsModule.forRoot(environment.production ? 'UA-1664521-8' : 'UA-FAKE-ID')
    ),
  ],
};

/**
 * Standalone PWA config - NO hydration to avoid mismatch with HashLocationStrategy
 * SSR generates HTML with PathLocationStrategy, but standalone PWA uses HashLocationStrategy
 */
export const browserConfigStandalone: ApplicationConfig = {
  providers: [
    ...appConfig.providers,
    // No provideClientHydration() - fresh bootstrap instead of hydration
    importProvidersFrom(
      NgxGoogleAnalyticsModule.forRoot(environment.production ? 'UA-1664521-8' : 'UA-FAKE-ID')
    ),
  ],
};
