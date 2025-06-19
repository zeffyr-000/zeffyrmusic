import { provideServerRendering } from '@angular/ssr';
import { mergeApplicationConfig, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { appConfig } from './app.config';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { provideTransloco, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { environment } from 'src/environments/environment';
import { TranslocoHttpLoader } from './transloco.loader';
import { NgbActiveModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { BrowserModule, Title, Meta } from '@angular/platform-browser';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { AngularDraggableModule } from 'angular2-draggable';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';
import { AppRoutingModule } from './app-routing.module';

const serverConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(BrowserModule, AppRoutingModule, FormsModule, NgbModule, AngularDraggableModule, NgxGoogleAnalyticsModule.forRoot(environment.production ? 'UA-1664521-8' : 'UA-FAKE-ID'), NgbTooltipModule, TranslocoModule, YouTubePlayerModule),
    Title,
    Meta,
    TranslocoService,
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    provideServerRendering(),
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
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
