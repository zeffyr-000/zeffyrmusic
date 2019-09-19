import { BrowserModule, Title, Meta } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FacebookModule } from 'ngx-facebook';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment';
import { translocoLoader } from './transloco.loader';
import { TranslocoModule, TRANSLOCO_CONFIG, TranslocoConfig, TranslocoService } from '@ngneat/transloco';
import { AngularDraggableModule } from 'angular2-draggable';

import { HomeComponent } from './home/home.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { ArtistComponent } from './artist/artist.component';
import { SearchComponent } from './search/search.component';
import { HeaderComponent } from './header/header.component';
import { PlayerComponent } from './player/player.component';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { ToMMSSPipe } from './pipes/to-mmss.pipe';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        PlaylistComponent,
        ArtistComponent,
        SearchComponent,
        HeaderComponent,
        PlayerComponent,
        SearchBarComponent,
        ToMMSSPipe
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        NgbModule,
        HttpClientModule,
        TranslocoModule,
        AngularDraggableModule,
        FacebookModule.forRoot(),
        NgxGoogleAnalyticsModule.forRoot('UA-1664521-8')
    ],
    providers: [{
        provide: TRANSLOCO_CONFIG,
        useValue: {
            listenToLangChange: true,
            defaultLang: 'en',
            fallbackLang: 'fr',
            prodMode: environment.production,
            scopeStrategy: 'shared'
        } as TranslocoConfig
    },
    {
        provide: APP_INITIALIZER,
        multi: true,
        useFactory: preload,
        deps: [TranslocoService]
    },
        translocoLoader,
        NgbActiveModal,
        InitService,
        PlayerService,
        Title,
        Meta,
        TranslocoService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }

export function preload(transloco: TranslocoService) {
    return () => {
        let lang = 'fr';

        if (localStorage.langue && localStorage.langue === 'en') {
            lang = 'en';
        }

        return transloco.load(lang).toPromise();
    };
}
