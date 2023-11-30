import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Event, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'zeffyrmusic';
    isOnline = true;
    showMessageUnlog = false;
    showTapVideoYT = false;

    subscriptionMessageUnlog: Subscription;
    subscriptionMessageTap: Subscription;

    constructor(@Inject(DOCUMENT) private readonly document: Document,
        private readonly initService: InitService,
        private readonly playerService: PlayerService,
        private readonly router: Router,
        private readonly translocoService: TranslocoService) {
        this.initService.getPing();

        this.subscriptionMessageUnlog = this.initService.subjectMessageUnlog.subscribe(isShow => {
            this.showMessageUnlog = isShow;
        });

        this.subscriptionMessageTap = this.playerService.subjectMessageTap.subscribe(isShow => {
            this.showTapVideoYT = isShow;
        });

        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationStart) {
                // Show loading indicator
            }

            if (event instanceof NavigationEnd) {
                // Hide loading indicator
                document.querySelector('link[rel="canonical"]').setAttribute('href', location.origin + event.url);
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
        if (this.document) {
            this.document.documentElement.lang = this.translocoService.getActiveLang();
        }
    }

    ngOnDestroy() {
        this.subscriptionMessageUnlog.unsubscribe();
        this.subscriptionMessageTap.unsubscribe();
    }
}
