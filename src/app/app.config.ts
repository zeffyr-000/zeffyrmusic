import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
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
import { Title, Meta, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
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
    provideClientHydration(withEventReplay()),
    importProvidersFrom(
      NgxGoogleAnalyticsModule.forRoot(environment.production ? 'UA-1664521-8' : 'UA-FAKE-ID')
    ),
  ],
};
