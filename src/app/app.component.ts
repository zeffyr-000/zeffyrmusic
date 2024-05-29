import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, Renderer2, RendererFactory2 } from '@angular/core';
import { Event, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';
import { Subscription } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'zeffyrmusic';
    isOnline = true;
    showMessageUnlog = false;

    subscriptionMessageUnlog: Subscription;
    renderer: Renderer2;

    constructor(@Inject(DOCUMENT) private readonly document: Document,
        private rendererFactory: RendererFactory2,
        private readonly initService: InitService,
        private readonly playerService: PlayerService,
        private readonly router: Router,
        private readonly metaService: Meta,
        private readonly translocoService: TranslocoService) {
        this.initService.getPing();

        this.renderer = this.rendererFactory.createRenderer(null, null);

        this.subscriptionMessageUnlog = this.initService.subjectMessageUnlog.subscribe(isShow => {
            this.showMessageUnlog = isShow;
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

        this.metaService.updateTag({ name: 'apple-mobile-web-app-capable', content: 'yes' });
        this.metaService.updateTag({ name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
        this.metaService.updateTag({ name: 'apple-mobile-web-app-title', content: 'ZeffyrMusic' });

        const linkElem = this.renderer.createElement('link');
        this.renderer.setAttribute(linkElem, 'rel', 'apple-touch-icon');
        this.renderer.setAttribute(linkElem, 'href', `${environment.URL_ASSETS}assets/img/apple-touch-icon.png`);
        this.renderer.appendChild(this.document.head, linkElem);
    }

    ngOnDestroy() {
        this.subscriptionMessageUnlog.unsubscribe();
    }
}
