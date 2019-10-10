import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, Meta, Title } from '@angular/platform-browser';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FacebookModule } from 'ngx-facebook';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';

import { HttpClientModule } from '@angular/common/http';
import { TRANSLOCO_CONFIG, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { AngularDraggableModule } from 'angular2-draggable';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { translocoLoader } from './transloco.loader';

import { ArtistComponent } from './artist/artist.component';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { ToMMSSPipe } from './pipes/to-mmss.pipe';
import { PlayerComponent } from './player/player.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { SearchComponent } from './search/search.component';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';

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
    providers: [
        {
            provide: TRANSLOCO_CONFIG,
            useValue: {
                reRenderOnLangChange: true,
                availableLangs: ['fr', 'en'],
                defaultLang: 'en',
                fallbackLang: 'fr',
                prodMode: environment.production
            }
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
