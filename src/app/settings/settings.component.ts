import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserReponse } from '../models/user.model';
import { UserService } from '../services/user.service';
import { TranslocoService } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
import { InitService } from '../services/init.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {

  successPass = false;
  successMail = false;
  successLanguage = false;
  successDelete = false;
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
    private readonly initService: InitService) { }

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
                  language: this.language
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
              language: this.language
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
                language: this.language
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

  ngOnDestroy() {
    this.subscriptionConnected.unsubscribe();
  }

}
