import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserReponse } from '../models/user.model';
import { UserService } from '../services/user.service';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
import { InitService } from '../services/init.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

// eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
declare var google: any;

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  imports: [FormsModule, TranslocoPipe]
})
export class SettingsComponent implements OnInit, OnDestroy, AfterViewInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @ViewChild('contentModalAssociateGoogleAccount') contentModalAssociateGoogleAccount: TemplateRef<any>;

  successPass = false;
  successMail = false;
  successLanguage = false;
  successDelete = false;
  successGoogleAccount = false;
  error = '';
  isConnected = true;
  mail = '';
  pseudo = '';
  idPerso = '';
  darkModeEnabled = false;
  language = 'fr';
  availableLanguages: string[] = [];
  subscriptionConnected: Subscription;

  constructor(public activeModal: NgbActiveModal,
    private readonly modalService: NgbModal,
    private readonly userService: UserService,
    private readonly translocoService: TranslocoService,
    private readonly titleService: Title,
    private readonly initService: InitService,
    private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.titleService.setTitle(this.translocoService.translate('settings') + ' - Zeffyr Music');
    this.availableLanguages = this.translocoService.getAvailableLangs() as string[];

    this.subscriptionConnected = this.initService.subjectConnectedChange?.subscribe(data => {
      this.isConnected = data.isConnected;
      this.mail = data.mail;
      this.pseudo = data.pseudo;
      this.idPerso = data.idPerso;
      this.darkModeEnabled = data.darkModeEnabled;
      this.language = data.language
    });
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
        this.userService.editPass(
          {
            passwordold: form.form.value.passwordold,
            passwordnew: form.form.value.password1
          })
          .subscribe({
            next: (data: UserReponse) => {
              if (data.success !== undefined && data.success) {
                this.successPass = true;
                this.initService.subjectConnectedChange.next({
                  isConnected: this.isConnected,
                  pseudo: this.pseudo,
                  idPerso: this.idPerso,
                  mail: this.mail,
                  darkModeEnabled: this.darkModeEnabled,
                  language: this.language,
                  pingInitialized: true
                });
                setTimeout(() => {
                  this.successPass = false;
                }, 10000);
              } else {
                this.error = this.translocoService.translate(data.error);
              }
            },
            error: () => {
              this.isConnected = false;
              this.initService.onMessageUnlog();
            }
          });
      } else {
        this.error = this.translocoService.translate('mot_de_passe_confirmer_invalide');
      }
    }
  }

  onSubmitEditMail(form: NgForm) {
    if (form.valid) {
      this.userService.editMail(form.form.value)
        .subscribe({
          next: (data: UserReponse) => {
            if (data.success !== undefined && data.success) {
              this.successMail = true;

              setTimeout(() => {
                this.successMail = false;
              }, 10000);
            } else {
              this.error = this.translocoService.translate(data.error);
            }
          },
          error: () => {
            this.isConnected = false;
            this.initService.onMessageUnlog();
          }
        });
    }
  }

  onSwitchDarkMode() {
    this.userService.editDarkMode({ dark_mode_enabled: this.darkModeEnabled })
      .subscribe({
        next: (data: UserReponse) => {
          if (data.success !== undefined && data.success) {
            this.initService.subjectConnectedChange.next({
              isConnected: this.isConnected,
              pseudo: this.pseudo,
              idPerso: this.idPerso,
              mail: this.mail,
              darkModeEnabled: this.darkModeEnabled,
              language: this.language,
              pingInitialized: true
            });
          } else {
            this.error = this.translocoService.translate(data.error);
          }
        },
        error: () => {
          this.isConnected = false;
          this.initService.onMessageUnlog();
        }
      });
  }

  onSubmitEditLanguage(form: NgForm) {
    if (form.valid) {
      this.userService.editLanguage(form.form.value)
        .subscribe({
          next: (data: UserReponse) => {
            if (data.success !== undefined && data.success) {
              this.successLanguage = true;
              this.initService.subjectConnectedChange.next({
                isConnected: this.isConnected,
                pseudo: this.pseudo,
                idPerso: this.idPerso,
                mail: this.mail,
                darkModeEnabled: this.darkModeEnabled,
                language: this.language,
                pingInitialized: true
              });

              setTimeout(() => {
                this.successLanguage = false;
              }, 10000);
            } else {
              this.error = this.translocoService.translate(data.error);
            }
          },
          error: () => {
            this.isConnected = false;
            this.initService.onMessageUnlog();
          }
        });
    }
  }

  onSubmitDeleteAccount(form: NgForm) {
    if (form.valid) {
      this.userService.deleteAccount(form.form.value)
        .subscribe({
          next: (data: UserReponse) => {
            if (data.success !== undefined && data.success) {
              this.successDelete = true;
              setTimeout(() => {
                this.successDelete = false;
              }, 10000);
              this.initService.logOut();
            } else {
              this.error = this.translocoService.translate(data.error);
            }
          },
          error: () => {
            this.isConnected = false;
            this.initService.onMessageUnlog();
          }
        });
    }
  }

  initializeGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: environment.GOOGLE_CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this)
      });
    }
  }

  renderGoogleSignInButton() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {}
      );
    }
  }

  openGoogleAccountModal() {
    const modalRef: NgbModalRef = this.modalService.open(this.contentModalAssociateGoogleAccount, { size: 'lg' });
    modalRef.result.then(
      () => this.renderGoogleSignInButton(),
      () => this.renderGoogleSignInButton()
    );

    setTimeout(() => {
      this.renderGoogleSignInButton();
    }, 0);
  }

  handleCredentialResponse(response: { credential: string }) {
    this.userService.associateGoogleAccount({ id_token: response.credential })
      .subscribe({
        next: (data: UserReponse) => {
          if (data.success !== undefined && data.success) {
            this.successGoogleAccount = true;
            this.initService.subjectConnectedChange.next({
              isConnected: this.isConnected,
              pseudo: this.pseudo,
              idPerso: this.idPerso,
              mail: this.mail,
              darkModeEnabled: this.darkModeEnabled,
              language: this.language,
              pingInitialized: true
            });

            this.cdr.detectChanges();

            setTimeout(() => {
              this.successGoogleAccount = false;
              this.cdr.detectChanges();
            }, 10000);
          }
          else {
            this.error = this.translocoService.translate(data.error);
            this.cdr.detectChanges();
          }
        }
      });
  }

  ngOnDestroy() {
    this.subscriptionConnected.unsubscribe();
  }

}
