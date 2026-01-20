import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { form, FormField, required, email, minLength, validate } from '@angular/forms/signals';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserReponse } from '../models/user.model';
import { UserService } from '../services/user.service';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
import { InitService } from '../services/init.service';
import { AuthStore } from '../store';
import { environment } from 'src/environments/environment';
import '../models/google-identity.model';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslocoPipe],
})
export class SettingsComponent implements OnInit, AfterViewInit {
  activeModal = inject(NgbActiveModal);
  private readonly modalService = inject(NgbModal);
  private readonly userService = inject(UserService);
  private readonly translocoService = inject(TranslocoService);
  private readonly titleService = inject(Title);
  private readonly initService = inject(InitService);
  readonly authStore = inject(AuthStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('contentModalAssociateGoogleAccount')
  contentModalAssociateGoogleAccount!: TemplateRef<unknown>;

  // Local UI state as signals
  readonly successPass = signal(false);
  readonly successMail = signal(false);
  readonly successLanguage = signal(false);
  readonly successDelete = signal(false);
  readonly successGoogleAccount = signal(false);
  readonly error = signal('');
  readonly availableLanguages = signal<string[]>([]);

  // Signal Forms models
  readonly editPassModel = signal({ passwordold: '', password1: '', password2: '' });
  readonly editPassForm = form(this.editPassModel, schemaPath => {
    required(schemaPath.passwordold);
    required(schemaPath.password1);
    minLength(schemaPath.password1, 4, {
      message: () => this.translocoService.translate('validation_password_minlength', { min: 4 }),
    });
    required(schemaPath.password2);
    validate(schemaPath.password2, ({ value, valueOf }) => {
      if (value() !== valueOf(schemaPath.password1)) {
        return {
          kind: 'matching',
          message: this.translocoService.translate('validation_passwords_not_matching'),
        };
      }
      return null;
    });
  });

  readonly editMailModel = signal({ mail: '' });
  readonly editMailForm = form(this.editMailModel, schemaPath => {
    required(schemaPath.mail);
    email(schemaPath.mail, {
      message: () => this.translocoService.translate('validation_email_invalid'),
    });
  });

  readonly editLanguageModel = signal({ language: '' });
  readonly editLanguageForm = form(this.editLanguageModel, schemaPath => {
    required(schemaPath.language);
  });

  readonly deleteAccountModel = signal({ password: '' });
  readonly deleteAccountForm = form(this.deleteAccountModel, schemaPath => {
    required(schemaPath.password);
  });

  // Computed properties from AuthStore (direct access to signals)
  readonly isConnected = this.authStore.isAuthenticated;
  readonly mail = this.authStore.mail;
  readonly pseudo = this.authStore.pseudo;
  readonly idPerso = this.authStore.idPerso;
  readonly darkModeEnabled = this.authStore.isDarkMode;
  readonly language = this.authStore.language;

  ngOnInit() {
    this.titleService.setTitle(this.translocoService.translate('settings') + ' - Zeffyr Music');
    this.availableLanguages.set(this.translocoService.getAvailableLangs() as string[]);
    // Initialize form with current mail and language
    this.editMailModel.set({ mail: this.mail() });
    this.editLanguageModel.set({ language: this.language() });
  }

  ngAfterViewInit() {
    this.initializeGoogleSignIn();
  }

  openModal(content: TemplateRef<unknown>) {
    this.modalService.open(content, { size: 'lg' });
  }

  onSubmitEditPass(event: Event) {
    event.preventDefault();
    if (this.editPassForm().valid()) {
      const model = this.editPassModel();
      this.userService
        .editPass({
          passwordold: model.passwordold,
          passwordnew: model.password1,
        })
        .subscribe({
          next: (data: UserReponse) => {
            if (data.success !== undefined && data.success) {
              this.successPass.set(true);
              setTimeout(() => this.successPass.set(false), 10000);
            } else {
              this.error.set(this.translocoService.translate(data.error));
            }
          },
          error: () => this.initService.onMessageUnlog(),
        });
    }
  }

  onSubmitEditMail(event: Event) {
    event.preventDefault();
    if (this.editMailForm().valid()) {
      this.userService.editMail(this.editMailModel()).subscribe({
        next: (data: UserReponse) => {
          if (data.success !== undefined && data.success) {
            this.successMail.set(true);
            setTimeout(() => this.successMail.set(false), 10000);
          } else {
            this.error.set(this.translocoService.translate(data.error));
          }
        },
        error: () => this.initService.onMessageUnlog(),
      });
    }
  }

  onSwitchDarkMode() {
    const newDarkMode = !this.darkModeEnabled();
    this.userService.editDarkMode({ dark_mode_enabled: newDarkMode }).subscribe({
      next: (data: UserReponse) => {
        if (data.success !== undefined && data.success) {
          this.authStore.setDarkMode(newDarkMode);
        } else {
          this.error.set(this.translocoService.translate(data.error));
        }
      },
      error: () => this.initService.onMessageUnlog(),
    });
  }

  onSubmitEditLanguage(event: Event) {
    event.preventDefault();
    if (this.editLanguageForm().valid()) {
      const model = this.editLanguageModel();
      this.userService.editLanguage(model).subscribe({
        next: (data: UserReponse) => {
          if (data.success !== undefined && data.success) {
            this.successLanguage.set(true);
            this.authStore.setLanguage(model.language as 'fr' | 'en');
            setTimeout(() => this.successLanguage.set(false), 10000);
          } else {
            this.error.set(this.translocoService.translate(data.error));
          }
        },
        error: () => this.initService.onMessageUnlog(),
      });
    }
  }

  onSubmitDeleteAccount(event: Event) {
    event.preventDefault();
    if (this.deleteAccountForm().valid()) {
      this.userService.deleteAccount(this.deleteAccountModel()).subscribe({
        next: (data: UserReponse) => {
          if (data.success !== undefined && data.success) {
            this.successDelete.set(true);
            setTimeout(() => this.successDelete.set(false), 10000);
            this.authStore.logout();
          } else {
            this.error.set(this.translocoService.translate(data.error));
          }
        },
        error: () => this.initService.onMessageUnlog(),
      });
    }
  }

  initializeGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: environment.GOOGLE_CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this),
      });
    }
  }

  renderGoogleSignInButton() {
    if (!this.isBrowser) return;
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.renderButton(document.getElementById('google-signin-button')!, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
      });
    }
  }

  openGoogleAccountModal() {
    const modalRef: NgbModalRef = this.modalService.open(this.contentModalAssociateGoogleAccount, {
      size: 'lg',
    });
    modalRef.result.then(
      () => this.renderGoogleSignInButton(),
      () => this.renderGoogleSignInButton()
    );

    setTimeout(() => {
      this.renderGoogleSignInButton();
    }, 0);
  }

  handleCredentialResponse(response: { credential: string }) {
    this.userService.associateGoogleAccount({ id_token: response.credential }).subscribe({
      next: (data: UserReponse) => {
        if (data.success !== undefined && data.success) {
          this.successGoogleAccount.set(true);
          setTimeout(() => this.successGoogleAccount.set(false), 10000);
        } else {
          this.error.set(this.translocoService.translate(data.error));
        }
      },
    });
  }
}
