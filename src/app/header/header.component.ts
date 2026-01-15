import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  inject,
  effect,
  signal,
} from '@angular/core';
import { form, FormField, required, minLength, email } from '@angular/forms/signals';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
  NgbTooltip,
  NgbOffcanvas,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from 'src/environments/environment';
import { PlayerService } from '../services/player.service';
import { UserLibraryService } from '../services/user-library.service';
import { AuthStore, UserDataStore, PlayerStore, QueueStore, UiStore } from '../store';
import { UserService } from '../services/user.service';
import { LoginResponse, UserReponse } from '../models/user.model';
import { isPlatformBrowser } from '@angular/common';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { SwipeDownDirective } from '../directives/swipe-down.directive';
import { AngularDraggableModule } from 'angular2-draggable';
import '../models/google-identity.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    RouterLink,
    RouterLinkActive,
    SearchBarComponent,
    SwipeDownDirective,
    NgbTooltip,
    FormField,
    TranslocoPipe,
    AngularDraggableModule,
  ],
})
export class HeaderComponent {
  activeModal = inject(NgbActiveModal);
  private readonly modalService = inject(NgbModal);
  private readonly platformId = inject(PLATFORM_ID);
  readonly authStore = inject(AuthStore);
  readonly userDataStore = inject(UserDataStore);
  readonly playerStore = inject(PlayerStore);
  readonly queueStore = inject(QueueStore);
  readonly uiStore = inject(UiStore);
  playerService = inject(PlayerService);
  readonly userLibraryService = inject(UserLibraryService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly translocoService = inject(TranslocoService);

  readonly isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('contentModalLogin') contentModalLogin!: TemplateRef<unknown>;
  @ViewChild('contentModalRegister') contentModalRegister!: TemplateRef<unknown>;
  @ViewChild('contentMobileMenu', { static: true }) contentMobileMenu!: TemplateRef<unknown>;
  @ViewChild('sliderPlayer', {}) sliderPlayerRef!: ElementRef;
  @ViewChild('sliderVolume', {}) sliderVolumeRef!: ElementRef;
  @ViewChild('contentModalAddVideo', {})
  private readonly contentModalAddVideo!: TemplateRef<unknown>;

  private readonly offcanvasService = inject(NgbOffcanvas);

  onDragingPlayer = false;
  readonly isRegistered = signal(false);
  readonly error = signal('');
  readonly isSuccess = signal(false);
  addKey = '';
  addArtist = '';
  addTitle = '';
  addDuration = 0;
  URL_ASSETS: string;
  readonly isPlayerExpanded = signal(false);

  // Signal Forms models
  readonly registerModel = signal({ pseudo: '', mail: '', password: '' });
  readonly registerForm = form(this.registerModel, schemaPath => {
    required(schemaPath.pseudo);
    minLength(schemaPath.pseudo, 4, {
      message: () => this.translocoService.translate('validation_minlength', { min: 4 }),
    });
    required(schemaPath.mail);
    email(schemaPath.mail, {
      message: () => this.translocoService.translate('validation_email_invalid'),
    });
    required(schemaPath.password);
    minLength(schemaPath.password, 4, {
      message: () => this.translocoService.translate('validation_password_minlength', { min: 4 }),
    });
  });

  readonly loginModel = signal({ pseudo: '', password: '' });
  readonly loginForm = form(this.loginModel, schemaPath => {
    required(schemaPath.pseudo);
    minLength(schemaPath.pseudo, 4, {
      message: () => this.translocoService.translate('validation_minlength', { min: 4 }),
    });
    required(schemaPath.password);
    minLength(schemaPath.password, 4, {
      message: () => this.translocoService.translate('validation_password_minlength', { min: 4 }),
    });
  });

  readonly resetPassModel = signal({ mail: '' });
  readonly resetPassForm = form(this.resetPassModel, schemaPath => {
    required(schemaPath.mail);
    email(schemaPath.mail, {
      message: () => this.translocoService.translate('validation_email_invalid'),
    });
  });

  constructor() {
    this.URL_ASSETS = environment.URL_ASSETS;

    effect(() => {
      const data = this.uiStore.addVideoData();
      if (data) {
        this.addKey = data.key;
        this.addArtist = data.artist;
        this.addTitle = data.title;
        this.addDuration = data.duration;

        this.openModal(this.contentModalAddVideo);
      }
    });
  }

  goFullscreen(id: string) {
    if (!this.isBrowser) return;
    const el = document.getElementById(id);
    el?.requestFullscreen();
  }

  repeat() {
    this.playerService.switchRepeat();
  }

  random() {
    this.playerService.switchRandom();
  }

  onDragMovingPlayer(e: { x: number }) {
    this.onDragingPlayer = true;
    this.onUpdateSliderPlayer(e.x);
    if (this.sliderPlayerRef?.nativeElement) {
      this.sliderPlayerRef.nativeElement.style.left = 'auto';
    }
  }

  onDragEndPlayer(e: { x: number }) {
    this.onDragingPlayer = false;
    this.onUpdateSliderPlayer(e.x);
    if (this.sliderPlayerRef?.nativeElement) {
      this.sliderPlayerRef.nativeElement.style.transform = 'none';
    }
  }

  onClickSliderPlayer(e: { offsetX: number }) {
    this.onUpdateSliderPlayer(e.offsetX);
    if (this.sliderPlayerRef?.nativeElement) {
      this.sliderPlayerRef.nativeElement.style.transform = 'none';
    }
  }

  onUpdateSliderPlayer(value: number) {
    // Guard: sliderPlayerRef can be null during SSR or before AfterViewInit
    if (!this.sliderPlayerRef?.nativeElement) {
      return;
    }
    const size = this.sliderPlayerRef.nativeElement.parentNode.offsetWidth;
    if (value < 0) {
      value = 0;
    }

    if (value > size) {
      value = size;
    }

    const position = value / size;
    this.playerService.updatePositionSlider(position);
  }

  onDragMovingVolume(e: { x: number }) {
    this.playerService.updateVolume(e.x);
    if (this.sliderVolumeRef?.nativeElement) {
      this.sliderVolumeRef.nativeElement.style.left = 'auto';
    }
  }

  onDragEndVolume(e: { x: number }) {
    this.onUpdateVolume(e.x);
    if (this.sliderVolumeRef?.nativeElement) {
      this.sliderVolumeRef.nativeElement.style.transform = 'none';
    }
  }

  onClickSliderVolume(e: { offsetX: number }) {
    this.onUpdateVolume(e.offsetX);
    if (this.sliderVolumeRef?.nativeElement) {
      this.sliderVolumeRef.nativeElement.style.transform = 'none';
    }
  }

  onUpdateVolume(value: number) {
    // Guard: sliderVolumeRef can be null during SSR or before AfterViewInit
    if (!this.sliderVolumeRef?.nativeElement) {
      return;
    }
    const size = this.sliderVolumeRef.nativeElement.parentNode.offsetWidth;
    if (value < 0) {
      value = 0;
    }

    if (value > size) {
      value = size;
    }

    const volume = Math.round((100 * value) / size);

    this.playerService.updateVolume(volume);
  }

  onPlayPause() {
    this.playerService.onPlayPause();
  }

  onBefore() {
    this.playerService.before();
  }

  onAfter() {
    this.playerService.after();
  }

  expandPlayer() {
    this.isPlayerExpanded.set(true);
  }

  collapsePlayer() {
    this.isPlayerExpanded.set(false);
  }

  openModal(content: TemplateRef<unknown>) {
    // Blur the currently focused element so focus is not trapped on an element
    // that will be hidden via aria-hidden when the modal opens (prevents screen
    // readers from focusing on hidden content).
    if (this.isBrowser && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.modalService.open(content, { size: 'lg' });
  }

  dismissAndOpenModal(modal: NgbModalRef, content: TemplateRef<unknown>) {
    modal.dismiss('');
    this.openModal(content);
  }

  dismissAndOpenLogin(modal: NgbModalRef) {
    modal.dismiss('');
    this.openModalLogin();
  }

  onSubmitRegister(event: Event) {
    event.preventDefault();
    if (this.registerForm().valid()) {
      this.userService.register(this.registerModel()).subscribe((data: UserReponse) => {
        if (data.success !== undefined && data.success) {
          this.isRegistered.set(true);

          this.googleAnalyticsService.pageView('/inscription/succes');
        } else {
          this.error.set(this.translocoService.translate(data?.error || 'generic_error'));
        }
      });
    }
  }

  onLogIn(event: Event | null, modal: NgbActiveModal | null, token: string) {
    event?.preventDefault();
    if (token || this.loginForm().valid()) {
      const formValue = this.loginModel();
      this.userService.login(formValue, token).subscribe((data: LoginResponse) => {
        if (data.success !== undefined && data.success) {
          // Login via AuthStore
          this.authStore.login(
            { pseudo: data.pseudo, idPerso: data.id_perso, mail: data.mail },
            {
              darkModeEnabled: data.dark_mode_enabled,
              language: data.language as 'fr' | 'en',
            }
          );

          this.userLibraryService.initializeFromLogin(
            data.liste_playlist,
            data.liste_suivi,
            data.like_video
          );

          if (modal) {
            modal.dismiss('');
          } else {
            this.modalService.dismissAll();
          }
        } else {
          this.error.set(this.translocoService.translate(data?.error || 'generic_error'));
        }
      });
    }
  }

  onLogout() {
    this.userService.logout().subscribe((data: UserReponse) => {
      if (data.success !== undefined && data.success) {
        // Logout via AuthStore (also clears cookie)
        this.authStore.logout();

        const url = this.router.url;
        const urlProtected = this.router.config
          ?.filter(route => route.canActivate !== undefined)
          .map(route => route.path);
        if (urlProtected?.includes(url.split('/')[1])) {
          this.router.navigate(['/']);
        }
      }
    });
  }

  onSubmitResetPass(event: Event) {
    event.preventDefault();
    if (this.resetPassForm().valid()) {
      this.userService.resetPass(this.resetPassModel()).subscribe((data: UserReponse) => {
        if (data.success !== undefined && data.success) {
          this.isSuccess.set(true);
        } else {
          this.error.set(this.translocoService.translate(data?.error || 'generic_error'));
        }
      });
    }
  }

  onAddVideo(idPlaylist: string, modal: NgbActiveModal) {
    this.userLibraryService
      .addVideoToPlaylist(idPlaylist, this.addKey, this.addTitle, this.addArtist, this.addDuration)
      .subscribe();
    modal.dismiss();
  }

  openMobileMenu(): void {
    this.offcanvasService.open(this.contentMobileMenu, {
      position: 'start',
      ariaLabelledBy: 'offcanvas-mobile-menu-title',
    });
  }

  closeMobileMenu(): void {
    this.offcanvasService.dismiss();
  }

  openModalLogin() {
    // Blur the active element to prevent aria-hidden conflict
    if (this.isBrowser && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const modalRef: NgbModalRef = this.modalService.open(this.contentModalLogin, { size: 'lg' });
    modalRef.result.then(
      () => this.renderGoogleSignInButton(),
      () => this.renderGoogleSignInButton()
    );

    setTimeout(() => {
      this.renderGoogleSignInButton();
    }, 0);
  }

  renderGoogleSignInButton() {
    if (!this.isBrowser) return;
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: environment.GOOGLE_CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this),
      });
      google.accounts.id.renderButton(document.getElementById('google-signin-button-header')!, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
      });
    }
  }

  handleCredentialResponse(response: { credential: string }) {
    this.onLogIn(null, null, response.credential);
  }

  renderGoogleRegisterButton() {
    if (!this.isBrowser) return;
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: environment.GOOGLE_CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this),
      });
      google.accounts.id.renderButton(document.getElementById('google-register-button-header')!, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
      });
    }
  }

  openModalRegister() {
    // Blur the active element to prevent aria-hidden conflict
    if (this.isBrowser && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const modalRef: NgbModalRef = this.modalService.open(this.contentModalRegister, { size: 'lg' });
    modalRef.result.then(
      () => this.renderGoogleRegisterButton(),
      () => this.renderGoogleRegisterButton()
    );

    setTimeout(() => {
      this.renderGoogleRegisterButton();
    }, 0);
  }
}
