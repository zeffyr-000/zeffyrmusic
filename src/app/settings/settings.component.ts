import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
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
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslocoPipe],
})
export class SettingsComponent implements OnInit, AfterViewInit {
  activeModal = inject(NgbActiveModal);
  private readonly modalService = inject(NgbModal);
  private readonly userService = inject(UserService);
  private readonly translocoService = inject(TranslocoService);
  private readonly titleService = inject(Title);
  private readonly initService = inject(InitService);
  readonly authStore = inject(AuthStore);

  @ViewChild('contentModalAssociateGoogleAccount')
  contentModalAssociateGoogleAccount: TemplateRef<unknown>;

  // Local UI state as signals
  readonly successPass = signal(false);
  readonly successMail = signal(false);
  readonly successLanguage = signal(false);
  readonly successDelete = signal(false);
  readonly successGoogleAccount = signal(false);
  readonly error = signal('');
  readonly availableLanguages = signal<string[]>([]);

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
  }

  ngAfterViewInit() {
    this.initializeGoogleSignIn();
  }

  openModal(content: TemplateRef<unknown>) {
    this.modalService.open(content, { size: 'lg' });
  }

  onSubmitEditPass(form: NgForm) {
    if (form.valid) {
      if (form.form.value.password1 === form.form.value.password2) {
        this.userService
          .editPass({
            passwordold: form.form.value.passwordold,
            passwordnew: form.form.value.password1,
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
      } else {
        this.error.set(this.translocoService.translate('mot_de_passe_confirmer_invalide'));
      }
    }
  }

  onSubmitEditMail(form: NgForm) {
    if (form.valid) {
      this.userService.editMail(form.form.value).subscribe({
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

  onSubmitEditLanguage(form: NgForm) {
    if (form.valid) {
      this.userService.editLanguage(form.form.value).subscribe({
        next: (data: UserReponse) => {
          if (data.success !== undefined && data.success) {
            this.successLanguage.set(true);
            this.authStore.setLanguage(form.form.value.language as 'fr' | 'en');
            setTimeout(() => this.successLanguage.set(false), 10000);
          } else {
            this.error.set(this.translocoService.translate(data.error));
          }
        },
        error: () => this.initService.onMessageUnlog(),
      });
    }
  }

  onSubmitDeleteAccount(form: NgForm) {
    if (form.valid) {
      this.userService.deleteAccount(form.form.value).subscribe({
        next: (data: UserReponse) => {
          if (data.success !== undefined && data.success) {
            this.successDelete.set(true);
            setTimeout(() => this.successDelete.set(false), 10000);
            this.authStore.logout();
            this.initService.logOut();
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
