import { enableProdMode, importProvidersFrom } from '@angular/core';

import { environment } from './environments/environment';
import { LocationStrategy, HashLocationStrategy, PathLocationStrategy, APP_BASE_HREF } from '@angular/common';
import { NgbActiveModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { InitService } from './app/services/init.service';
import { PlayerService } from './app/services/player.service';
import { Title, Meta, BrowserModule, bootstrapApplication, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { TranslocoService, provideTransloco, TranslocoModule } from '@jsverse/transloco';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { appConfig } from './app/app.config';
import { TranslocoHttpLoader } from './app/transloco.loader';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { AppRoutingModule } from './app/app-routing.module';
import { FormsModule } from '@angular/forms';
import { AngularDraggableModule } from 'angular2-draggable';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { AppComponent } from './app/app.component';

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, FormsModule, NgbModule, AngularDraggableModule, NgxGoogleAnalyticsModule.forRoot(environment.production ? 'UA-1664521-8' : 'UA-FAKE-ID'), NgbTooltipModule, TranslocoModule, YouTubePlayerModule),
        { provide: APP_BASE_HREF, useValue: '/' },
        {
            provide: LocationStrategy,
            useClass: ('standalone' in window.navigator && window.navigator.standalone) ?
                HashLocationStrategy : PathLocationStrategy
        },
        NgbActiveModal,
        InitService,
        PlayerService,
        Title,
        Meta,
        TranslocoService,
        provideHttpClient(withInterceptorsFromDi(), withFetch()),
        appConfig.providers,
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
        provideTranslocoMessageformat(), provideClientHydration(withEventReplay()),
    ]
})
    // tslint:disable-next-line: no-console
    .catch(err => console.error(err));
