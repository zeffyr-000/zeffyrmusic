import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';

import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideShareButtonsOptions, withConfig } from 'ngx-sharebuttons';
import { shareIcons } from 'ngx-sharebuttons/icons';
import { httpConfigInterceptor } from './interceptor/httpConfigInterceptor';
import { errorInterceptor } from './interceptor/errorInterceptor';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { TranslocoHttpLoader } from './transloco.loader';
import { environment } from '../environments/environment';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Title, Meta } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: () => {
          // Blur active element before transition to prevent
          // "Blocked aria-hidden on a focused element" warning
          const active = document.activeElement;
          if (active instanceof HTMLElement) {
            active.blur();
          }
        },
      })
    ),
    provideHttpClient(withFetch(), withInterceptors([httpConfigInterceptor, errorInterceptor])),
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
