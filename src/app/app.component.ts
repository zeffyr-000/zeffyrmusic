import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { Event, NavigationEnd, NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';
import { filter, Subscription } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { HeaderComponent } from './header/header.component';
import { PlayerComponent } from './player/player.component';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    imports: [HeaderComponent, PlayerComponent, RouterLink, RouterOutlet, NgbAlert, TranslocoPipe]
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'zeffyrmusic';
    isOnline = true;
    showMessageUnlog = false;
    currentUrl: string;

    subscriptionMessageUnlog: Subscription;
    renderer: Renderer2;
    errorMessage: string | null = null;
    private errorMessageSubscription: Subscription;
    private isBrowser: boolean;

    constructor(@Inject(DOCUMENT) private readonly document: Document,
        @Inject(PLATFORM_ID) private platformId: object,
        private rendererFactory: RendererFactory2,
        private readonly initService: InitService,
        protected readonly playerService: PlayerService,
        private readonly router: Router,
        private readonly metaService: Meta,
        private readonly translocoService: TranslocoService,
        private cdr: ChangeDetectorRef) {
        this.isBrowser = isPlatformBrowser(this.platformId);

        this.renderer = this.rendererFactory.createRenderer(null, null);

        this.subscriptionMessageUnlog = this.initService.subjectMessageUnlog.subscribe(isShow => {
            this.showMessageUnlog = isShow;
        });
        if (this.isBrowser) {
            this.router.events.pipe(
                filter(event => event instanceof NavigationEnd)
            ).subscribe((event: NavigationEnd) => {
                this.currentUrl = event.urlAfterRedirects;
            });

            this.router.events.subscribe((event: Event) => {
                if (event instanceof NavigationStart) {
                    // Show loading indicator
                }

                if (event instanceof NavigationEnd) {
                    // Hide loading indicator
                }
            });


            window.addEventListener('offline', () => {
                this.isOnline = false;
            });

            window.addEventListener('online', () => {
                this.isOnline = true;
            });
        }

    }

    ngOnInit() {
        this.initService.getPing();

        if (!this.isBrowser) {
            return;
        }

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

        const linkLoading = this.renderer.createElement('link');
        this.renderer.setAttribute(linkLoading, 'rel', 'preload');
        this.renderer.setAttribute(linkLoading, 'as', 'image');
        this.renderer.setAttribute(linkLoading, 'href', `${environment.URL_ASSETS}assets/img/loading.jpg`);
        this.renderer.appendChild(document.head, linkLoading);

        const link = this.renderer.createElement('link');
        this.renderer.setAttribute(link, 'rel', 'preload');
        this.renderer.setAttribute(link, 'as', 'image');
        this.renderer.setAttribute(link, 'href', `${environment.URL_ASSETS}assets/img/default.jpg`);
        this.renderer.appendChild(document.head, link);

        this.errorMessageSubscription = this.playerService.errorMessage$.subscribe(
            message => {
                this.errorMessage = message;
                this.cdr.detectChanges();
            }
        );
    }

    isRedirectingToCurrentUrl(): boolean {
        const targetUrl = this.playerService.currentIdTopCharts
            ? `/top/${this.playerService.currentIdTopCharts}`
            : `/playlist/${this.playerService.currentIdPlaylist}`;
        return this.currentUrl === targetUrl;
    }

    clearErrorMessage() {
        this.playerService.clearErrorMessage();
    }

    ngOnDestroy() {
        this.subscriptionMessageUnlog?.unsubscribe();
        this.errorMessageSubscription?.unsubscribe();
    }
}
