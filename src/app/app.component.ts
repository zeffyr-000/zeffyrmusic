import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
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
import { PlayerStore } from './store/player/player.store';
import { QueueStore } from './store/queue/queue.store';
import { UiStore } from './store/ui/ui.store';
import { ToastContainerComponent } from './toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    ControlBarComponent,
    PlayerComponent,
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
        });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
      });

      window.addEventListener('online', () => {
        this.isOnline.set(true);
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
    return this.currentUrl() === targetUrl;
  }

  clearErrorMessage() {
    this.playerStore.clearError();
  }

  reload() {
    window.location.reload();
  }
}
