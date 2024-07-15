import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, Meta, Title } from '@angular/platform-browser';
import { NgbActiveModal, NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TranslocoModule, TranslocoService, provideTransloco } from '@jsverse/transloco';
import { AngularDraggableModule } from 'angular2-draggable';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ShareButtons } from 'ngx-sharebuttons/buttons';

import { ArtistComponent } from './artist/artist.component';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { ToMMSSPipe } from './pipes/to-mmss.pipe';
import { SwipeDownDirective } from './directives/swipe-down.directive';
import { PlayerComponent } from './player/player.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { SearchComponent } from './search/search.component';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';
import { HashLocationStrategy, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { HelpComponent } from './help/help.component';
import { HelpPageComponent } from './help/help-page/help-page.component';
import { CurrentComponent } from './current/current.component';
import { appConfig } from './app.config';
import { TranslocoHttpLoader } from './transloco.loader';
import { ArtistListComponent } from './playlist/artist-list/artist-list.component';
import { DefaultImageDirective } from './directives/default-image.directive';
import { SettingsComponent } from './settings/settings.component';

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
        CurrentComponent,
        SwipeDownDirective,
        ArtistListComponent,
        DefaultImageDirective,
        SettingsComponent
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        NgbModule,
        AngularDraggableModule,
        NgxGoogleAnalyticsModule.forRoot(environment.production ? 'UA-1664521-8' : 'UA-FAKE-ID'),
        ShareButtons,
        NgbTooltipModule,
        TranslocoModule
    ],
    providers: [
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
        provideHttpClient(withInterceptorsFromDi()),
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
        })
    ]
})
export class AppModule { }