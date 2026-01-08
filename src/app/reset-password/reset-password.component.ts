import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { form, Field, required, minLength, validate } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [Field, TranslocoPipe],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private transloco = inject(TranslocoService);

  readonly formModel = signal({
    password: '',
    confirmPassword: '',
  });

  readonly resetForm = form(this.formModel, schemaPath => {
    required(schemaPath.password);
    minLength(schemaPath.password, 6, {
      message: this.transloco.translate('validation_password_minlength', { min: 6 }),
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
  });

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly formInvalid = signal(false);
  readonly formSuccess = signal(false);

  private idPerso = '';
  private key = '';

  ngOnInit() {
    this.idPerso = this.route.snapshot.params['id_perso'];
    this.key = this.route.snapshot.params['key'];
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.submitted.set(true);

    if (this.resetForm().invalid()) {
      return;
    }

    this.loading.set(true);
    this.userService
      .sendResetPass({
        id_perso: this.idPerso,
        key: this.key,
        password: this.formModel().password,
      })
      .subscribe({
        next: data => {
          this.loading.set(false);

          if (data.success) {
            this.formSuccess.set(true);
            this.formInvalid.set(false);
          } else {
            this.formInvalid.set(true);
            this.formSuccess.set(false);
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
