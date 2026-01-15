import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  RendererFactory2,
  DOCUMENT,
  inject,
  ViewChild,
  TemplateRef,
  signal,
} from '@angular/core';
import {
  Event,
  NavigationEnd,
  NavigationStart,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';
import { PageLifecycleService } from './services/page-lifecycle.service';
import { filter, Subscription } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { HeaderComponent } from './header/header.component';
import { PlayerComponent } from './player/player.component';
import { NgbAlert, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlayerStore } from './store/player/player.store';
import { QueueStore } from './store/queue/queue.store';
import { UiStore } from './store/ui/ui.store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, PlayerComponent, RouterLink, RouterOutlet, NgbAlert, TranslocoPipe],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly document = inject<Document>(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private rendererFactory = inject(RendererFactory2);
  private readonly initService = inject(InitService);
  protected readonly playerService = inject(PlayerService);
  protected readonly playerStore = inject(PlayerStore);
  protected readonly queueStore = inject(QueueStore);
  protected readonly uiStore = inject(UiStore);
  private readonly router = inject(Router);
  private readonly metaService = inject(Meta);
  private readonly translocoService = inject(TranslocoService);
  private readonly modalService = inject(NgbModal);
  private readonly pageLifecycleService = inject(PageLifecycleService);

  title = 'zeffyrmusic';
  readonly isOnline = signal(true);
  currentUrl = '';

  renderer: Renderer2;
  private pageLifecycleSubscription!: Subscription;
  private isBrowser: boolean;

  @ViewChild('contentModalReload') contentModalReload!: TemplateRef<unknown>;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    this.renderer = this.rendererFactory.createRenderer(null, null);

    if (this.isBrowser) {
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
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
        this.isOnline.set(false);
      });

      window.addEventListener('online', () => {
        this.isOnline.set(true);
      });

      // Handle PWA resume events - refresh data when app is restored
      this.pageLifecycleSubscription = this.pageLifecycleService.resumed$.subscribe(event => {
        console.debug('[AppComponent] App resumed, refreshing data...', event);
        // Re-fetch session/user data to ensure fresh state
        this.initService.getPing().subscribe();
      });
    }
  }

  ngOnInit() {
    this.initService.getPing().subscribe((success: boolean) => {
      if (this.isBrowser && !success) {
        this.modalService.open(this.contentModalReload, { centered: true, size: 'lg' });
      }
    });

    if (!this.isBrowser) {
      return;
    }

    if (this.document) {
      this.document.documentElement.lang = this.translocoService.getActiveLang();
    }

    this.metaService.updateTag({ name: 'mobile-web-app-capable', content: 'yes' });
    this.metaService.updateTag({
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    });
    this.metaService.updateTag({ name: 'apple-mobile-web-app-title', content: 'ZeffyrMusic' });

    const linkElem = this.renderer.createElement('link');
    this.renderer.setAttribute(linkElem, 'rel', 'apple-touch-icon');
    this.renderer.setAttribute(
      linkElem,
      'href',
      `${environment.URL_ASSETS}assets/img/apple-touch-icon.png`
    );
    this.renderer.appendChild(this.document.head, linkElem);

    const linkLoading = this.renderer.createElement('link');
    this.renderer.setAttribute(linkLoading, 'rel', 'preload');
    this.renderer.setAttribute(linkLoading, 'as', 'image');
    this.renderer.setAttribute(
      linkLoading,
      'href',
      `${environment.URL_ASSETS}assets/img/loading.jpg`
    );
    this.renderer.appendChild(document.head, linkLoading);

    const link = this.renderer.createElement('link');
    this.renderer.setAttribute(link, 'rel', 'preload');
    this.renderer.setAttribute(link, 'as', 'image');
    this.renderer.setAttribute(link, 'href', `${environment.URL_ASSETS}assets/img/default.jpg`);
    this.renderer.appendChild(document.head, link);
  }

  isRedirectingToCurrentUrl(): boolean {
    const targetUrl = this.queueStore.sourceTopChartsId()
      ? `/top/${this.queueStore.sourceTopChartsId()}`
      : `/playlist/${this.queueStore.sourcePlaylistId()}`;
    return this.currentUrl === targetUrl;
  }

  clearErrorMessage() {
    this.playerStore.clearError();
  }

  reload() {
    window.location.reload();
  }

  ngOnDestroy() {
    this.pageLifecycleSubscription?.unsubscribe();
  }
}
