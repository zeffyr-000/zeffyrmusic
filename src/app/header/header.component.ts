import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  inject,
  effect,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  required,
  minLength,
  email,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalRef,
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
  NgbOffcanvas,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from 'src/environments/environment';
import { UserLibraryService } from '../services/user-library.service';
import { AuthStore, UserDataStore, UiStore } from '../store';
import { UserService } from '../services/user.service';
import { UserReponse } from '../models/user.model';
import { isPlatformBrowser } from '@angular/common';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import '../models/google-identity.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    RouterLink,
    RouterLinkActive,
    SearchBarComponent,
    FormField,
    FormRoot,
    TranslocoPipe,
  ],
})
export class HeaderComponent {
  private readonly modalService = inject(NgbModal);
  private readonly platformId = inject(PLATFORM_ID);
  readonly authStore = inject(AuthStore);
  readonly userDataStore = inject(UserDataStore);
  readonly uiStore = inject(UiStore);
  readonly userLibraryService = inject(UserLibraryService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly translocoService = inject(TranslocoService);

  readonly isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('contentModalLogin') contentModalLogin!: TemplateRef<unknown>;
  @ViewChild('contentModalRegister') contentModalRegister!: TemplateRef<unknown>;
  @ViewChild('contentMobileMenu', { static: true }) contentMobileMenu!: TemplateRef<unknown>;
  @ViewChild('contentModalAddVideo', {})
  private readonly contentModalAddVideo!: TemplateRef<unknown>;

  private readonly offcanvasService = inject(NgbOffcanvas);

  readonly isRegistered = signal(false);
  readonly registerError = signal('');
  readonly loginError = signal('');
  readonly resetError = signal('');
  readonly addVideoError = signal('');
  readonly isSuccess = signal(false);
  readonly isSubmittingRegister = signal(false);
  readonly isSubmittingLogin = signal(false);
  readonly isSubmittingReset = signal(false);
  addKey = '';
  addArtist = '';
  addTitle = '';
  addDuration = 0;
  URL_ASSETS: string;

  // Signal Forms models
  readonly registerModel = signal({ pseudo: '', mail: '', password: '' });
  readonly registerForm = form(
    this.registerModel,
    schemaPath => {
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
      validate(schemaPath.password, ({ value }) => {
        if ((value() as string).length > 128) {
          return {
            kind: 'maxlength',
            message: this.translocoService.translate('validation_maxlength', { max: 128 }),
          };
        }
        return null;
      });
    },
    {
      submission: {
        action: async () => {
          this.isSubmittingRegister.set(true);
          try {
            const data = await firstValueFrom(this.userService.register(this.registerModel()));
            if (data.success !== undefined && data.success) {
              this.isRegistered.set(true);
              this.googleAnalyticsService.pageView('/inscription/succes', 'Inscription réussie');
            } else {
              this.registerError.set(
                this.translocoService.translate(data?.error || 'generic_error')
              );
            }
          } catch {
            this.registerError.set(this.translocoService.translate('generic_error'));
          } finally {
            this.isSubmittingRegister.set(false);
          }
        },
      },
    }
  );

  readonly loginModel = signal({ pseudo: '', password: '' });
  readonly loginForm = form(
    this.loginModel,
    schemaPath => {
      required(schemaPath.pseudo);
      minLength(schemaPath.pseudo, 4, {
        message: () => this.translocoService.translate('validation_minlength', { min: 4 }),
      });
      required(schemaPath.password);
      minLength(schemaPath.password, 4, {
        message: () => this.translocoService.translate('validation_password_minlength', { min: 4 }),
      });
    },
    {
      submission: {
        action: async () => {
          this.isSubmittingLogin.set(true);
          try {
            await this.loginWithToken('');
          } finally {
            this.isSubmittingLogin.set(false);
          }
        },
      },
    }
  );

  readonly resetPassModel = signal({ mail: '' });
  readonly resetPassForm = form(
    this.resetPassModel,
    schemaPath => {
      required(schemaPath.mail);
      email(schemaPath.mail, {
        message: () => this.translocoService.translate('validation_email_invalid'),
      });
    },
    {
      submission: {
        action: async () => {
          this.isSubmittingReset.set(true);
          try {
            const data = await firstValueFrom(this.userService.resetPass(this.resetPassModel()));
            if (data.success !== undefined && data.success) {
              this.isSuccess.set(true);
            } else {
              this.resetError.set(this.translocoService.translate(data?.error || 'generic_error'));
            }
          } catch {
            this.isSuccess.set(false);
            this.resetError.set(this.translocoService.translate('generic_error'));
          } finally {
            this.isSubmittingReset.set(false);
          }
        },
      },
    }
  );

  constructor() {
    this.URL_ASSETS = environment.URL_ASSETS;

    effect(() => {
      const data = this.uiStore.addVideoData();
      if (data) {
        this.addKey = data.key;
        this.addArtist = data.artist;
        this.addTitle = data.title;
        this.addDuration = data.duration;

        this.addVideoError.set('');
        this.openModal(this.contentModalAddVideo);
      }
    });
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

  openModalResetPass(content: TemplateRef<unknown>) {
    this.resetPassModel.set({ mail: '' });
    this.resetError.set('');
    this.isSuccess.set(false);
    this.isSubmittingReset.set(false);
    this.openModal(content);
  }

  dismissAndOpenLogin(modal: NgbModalRef) {
    modal.dismiss('');
    this.openModalLogin();
  }

  dismissAndOpenRegister(modal: NgbModalRef) {
    modal.dismiss('');
    this.openModalRegister();
  }

  private async loginWithToken(token: string): Promise<void> {
    try {
      const formValue = this.loginModel();
      const data = await firstValueFrom(this.userService.login(formValue, token));
      if (data.success !== undefined && data.success) {
        // Login via AuthStore
        this.authStore.login(
          { pseudo: data.pseudo, idPerso: data.id_perso, mail: data.mail, isAdmin: data.is_admin },
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
        this.modalService.dismissAll();
      } else {
        this.loginError.set(this.translocoService.translate(data?.error || 'generic_error'));
      }
    } catch {
      this.loginError.set(this.translocoService.translate('generic_error'));
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

  onAddVideo(idPlaylist: string, modal: NgbActiveModal) {
    this.userLibraryService
      .addVideoToPlaylist(idPlaylist, this.addKey, this.addTitle, this.addArtist, this.addDuration)
      .subscribe({
        next: success => {
          if (success) {
            this.uiStore.notifyVideoAddedToPlaylist(idPlaylist);
            this.uiStore.showSuccess(this.translocoService.translate('video_added_to_playlist'));
            modal.dismiss();
          } else {
            this.addVideoError.set(this.translocoService.translate('generic_error'));
          }
        },
        error: () => {
          this.addVideoError.set(this.translocoService.translate('generic_error'));
        },
      });
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
    this.loginModel.set({ pseudo: '', password: '' });
    this.loginError.set('');
    this.isSubmittingLogin.set(false);
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

  async handleCredentialResponse(response: { credential: string }): Promise<void> {
    await this.loginWithToken(response.credential);
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
    this.registerModel.set({ pseudo: '', mail: '', password: '' });
    this.registerError.set('');
    this.isRegistered.set(false);
    this.isSubmittingRegister.set(false);
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
