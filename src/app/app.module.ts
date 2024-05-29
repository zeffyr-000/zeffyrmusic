import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, Meta, Title } from '@angular/platform-browser';
import { NgbActiveModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';

import { HttpClientModule } from '@angular/common/http';
import { TRANSLOCO_CONFIG, TranslocoConfig, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { AngularDraggableModule } from 'angular2-draggable';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { translocoLoader } from './transloco.loader';
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';
import { ShareIconsModule } from 'ngx-sharebuttons/icons';

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
import { ShareButtonsConfig } from 'ngx-sharebuttons';
import { HashLocationStrategy, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { HelpComponent } from './help/help.component';
import { HelpPageComponent } from './help/help-page/help-page.component';
import { CurrentComponent } from './current/current.component';

const customConfig: ShareButtonsConfig = {
    include: ['facebook', 'twitter', 'whatsapp', 'copy'],
    gaTracking: true,
    prop: {
        copy: {
            text: 'Copier le lien',
            data: {
                successText: 'Lien copié !'
            }
        }
    }
}

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
        ToMMSSPipe,
        HelpComponent,
        HelpPageComponent,
        CurrentComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        NgbModule,
        HttpClientModule,
        TranslocoModule,
        AngularDraggableModule,
        NgxGoogleAnalyticsModule.forRoot(environment.production ? 'UA-1664521-8' : 'UA-FAKE-ID'),
        ShareButtonsModule.withConfig(customConfig),
        ShareIconsModule,
        NgbTooltipModule
    ],
    providers: [
        {
            provide: TRANSLOCO_CONFIG,
            useValue: {
                reRenderOnLangChange: false,
                availableLangs: [environment.lang],
                defaultLang: environment.lang,
                fallbackLang: environment.lang,
                prodMode: environment.production
            } as TranslocoConfig
        },
        {
            provide: APP_INITIALIZER,
            multi: true,
            useFactory: preload,
            deps: [TranslocoService]
        },
        {
            provide: LocationStrategy,
            useClass: ('standalone' in window.navigator && window.navigator.standalone) ?
                HashLocationStrategy : PathLocationStrategy
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
        return transloco.load(environment.lang).toPromise();
    };
}
