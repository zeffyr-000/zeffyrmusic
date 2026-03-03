import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { form, FormField, FormRoot, required, minLength, validate } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { UserService } from '../services/user.service';
import { UiStore } from '../store/ui/ui.store';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  imports: [FormField, FormRoot, RouterLink, TranslocoPipe],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly transloco = inject(TranslocoService);
  private readonly titleService = inject(Title);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly uiStore = inject(UiStore);

  readonly formModel = signal({
    password: '',
    confirmPassword: '',
  });

  readonly resetForm = form(
    this.formModel,
    schemaPath => {
      required(schemaPath.password);
      minLength(schemaPath.password, 6, {
        message: () => this.transloco.translate('validation_password_minlength', { min: 6 }),
      });
      required(schemaPath.confirmPassword);
      validate(schemaPath.confirmPassword, ({ value, valueOf }) => {
        const confirmPassword = value();
        const password = valueOf(schemaPath.password);
        if (confirmPassword !== password) {
          return {
            kind: 'matching',
            message: this.transloco.translate('validation_passwords_not_matching'),
          };
        }
        return null;
      });
    },
    {
      submission: {
        action: async () => {
          this.submitted.set(true);
          this.loading.set(true);
          try {
            const data = await firstValueFrom(
              this.userService.sendResetPass({
                id_perso: this.idPerso,
                key: this.key,
                password: this.formModel().password,
              })
            );
            this.loading.set(false);
            if (data.success) {
              this.formSuccess.set(true);
              this.formInvalid.set(false);
              this.uiStore.showSuccess(this.transloco.translate('reset_password_success'));
            } else {
              this.formInvalid.set(true);
              this.formSuccess.set(false);
              this.uiStore.showError(this.transloco.translate('reset_password_invalid'));
            }
          } catch {
            this.loading.set(false);
            this.formInvalid.set(true);
            this.uiStore.showError(this.transloco.translate('generic_error'));
          }
        },
        onInvalid: () => this.submitted.set(true),
        ignoreValidators: 'none',
      },
    }
  );

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly formInvalid = signal(false);
  readonly formSuccess = signal(false);

  private idPerso = '';
  private key = '';

  ngOnInit() {
    this.titleService.setTitle(
      this.transloco.translate('reset_password_title') + ' - Zeffyr Music'
    );
    this.idPerso = this.route.snapshot.params['id_perso'];
    this.key = this.route.snapshot.params['key'];

    if (isPlatformBrowser(this.platformId)) {
      this.googleAnalyticsService.pageView('/reset-password', this.titleService.getTitle());
    }
  }
}
