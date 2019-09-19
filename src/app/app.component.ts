import { Component, Inject, OnInit, OnDestroy  } from '@angular/core';
import { InitService } from './services/init.service';
import { Router, Event, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { PlayerService } from './services/player.service';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'zeffyrmusic';
    isOnline = true;
    showMessageUnlog = false;
    showTapVideoYT = false;

    subscriptionMessageUnlog: any;
    subscriptionMessageTap: any;

    constructor(@Inject(DOCUMENT) private document: Document,
                private initService: InitService,
                private playerService: PlayerService,
                private router: Router,
                private translocoService: TranslocoService,
                private googleAnalyticsService: GoogleAnalyticsService) {
        this.initService.getPing();

        this.subscriptionMessageUnlog = this.initService.subjectMessageUnlog.subscribe((isShow) => {
            this.showMessageUnlog = isShow;
        });

        this.subscriptionMessageTap = this.playerService.subjectMessageTap.subscribe((isShow) => {
            this.showTapVideoYT = isShow;
        });

        let langStr = 'fr_FR';

        if (this.translocoService.getActiveLang() !== 'fr') {
            langStr = 'en_US';
        }

        const tag = document.createElement('script');
        tag.src = 'https://connect.facebook.net/' + langStr + '/sdk.js#xfbml=1&version=v4.0';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationStart) {
                // Show loading indicator
            }

            if (event instanceof NavigationEnd) {
                // Hide loading indicator
                document.querySelector('link[rel="canonical"]').setAttribute('href', location.origin + event.url);

                if ((window as any).FB) {
                    (window as any).FB.XFBML.parse();
                }
                
                this.googleAnalyticsService.pageView(event.url);
            }

            if (event instanceof NavigationError) {
                // Hide loading indicator

                // Present error to user
                console.log(event.error);
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        window.addEventListener('online', () => {
            this.isOnline = true;
        });

    }

    ngOnInit() {
        this.document.documentElement.lang = this.translocoService.getActiveLang();
    }

    ngOnDestroy() {
        this.subscriptionMessageUnlog.unsubscribe();
        this.subscriptionMessageTap.unsubscribe();
    }
}
