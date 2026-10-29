import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  RendererFactory2,
  DOCUMENT,
  inject,
  ViewChild,
  TemplateRef,
  signal,
  effect,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { InitService } from './services/init.service';
import { PlayerService } from './services/player.service';
import { FocusService } from './services/focus.service';
import { KeyboardShortcutService } from './services/keyboard-shortcut.service';
import { filter } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { HeaderComponent } from './header/header.component';
import { ControlBarComponent } from './control-bar/control-bar.component';
import { PlayerComponent } from './player/player.component';
import { NgbAlert, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthStore } from './store/auth/auth.store';
import { PlayerStore } from './store/player/player.store';
import { QueueStore } from './store/queue/queue.store';
import { UiStore } from './store/ui/ui.store';
import { ToastContainerComponent } from './toast-container/toast-container.component';
import { LyricsPanelComponent } from './lyrics-panel/lyrics-panel.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    HeaderComponent,
    ControlBarComponent,
    PlayerComponent,
    LyricsPanelComponent,
    RouterLink,
    RouterOutlet,
    NgbAlert,
    TranslocoPipe,
    ToastContainerComponent,
  ],
})
export class AppComponent implements OnInit {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly initService = inject(InitService);
  protected readonly playerService = inject(PlayerService);
  private readonly authStore = inject(AuthStore);
  protected readonly playerStore = inject(PlayerStore);
  protected readonly queueStore = inject(QueueStore);
  protected readonly uiStore = inject(UiStore);
  private readonly router = inject(Router);
  private readonly metaService = inject(Meta);
  private readonly translocoService = inject(TranslocoService);
  private readonly modalService = inject(NgbModal);
  private readonly focusService = inject(FocusService);
  private readonly keyboardShortcutService = inject(KeyboardShortcutService);

  readonly isOnline = signal(true);
  readonly currentUrl = signal('');

  private readonly renderer: Renderer2;
  private readonly isBrowser: boolean;

  @ViewChild('contentModalReload') contentModalReload!: TemplateRef<unknown>;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    this.renderer = this.rendererFactory.createRenderer(null, null);

    if (this.isBrowser) {
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.currentUrl.set(event.urlAfterRedirects);
          this.uiStore.closeLyricsPanel();
          this.initService.checkSessionIfNeeded();
        });

      globalThis.addEventListener('offline', () => {
        this.isOnline.set(false);
      });

      globalThis.addEventListener('online', () => {
        this.isOnline.set(true);
      });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.initService.checkSessionIfNeeded();
        }
      });

      // theme-color tints the opaque iOS status bar of the pinned app: keep it
      // identical to the .navbar-inverse header background so both blend.
      effect(() => {
        this.metaService.updateTag({
          name: 'theme-color',
          content: this.authStore.isDarkMode() ? '#000000' : '#ffffff',
        });
      });
    }
  }

  ngOnInit() {
    this.focusService.initialize();
    this.keyboardShortcutService.initialize();

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
    this.metaService.updateTag({ name: 'apple-mobile-web-app-capable', content: 'yes' });
    // No apple-mobile-web-app-status-bar-style: 'black-translucent' runs the page
    // under the status bar, where iOS 27 paints its scroll-edge blur over the
    // header and never replaces it with the fixed header's color. The default
    // style keeps an opaque bar tinted by theme-color (set in the constructor).
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
    return this.currentUrl() === targetUrl;
  }

  clearErrorMessage() {
    this.playerStore.clearError();
  }

  reload() {
    globalThis.location.reload();
  }
}
