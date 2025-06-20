import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoPipe],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private translocoService = inject(TranslocoService);
  private cdr = inject(ChangeDetectorRef);

  resetForm: FormGroup;
  loading = false;
  submitted = false;
  idPerso: string;
  key: string;
  formInvalid = false;
  formSuccess = false;

  ngOnInit() {
    this.idPerso = this.route.snapshot.params['id_perso'];
    this.key = this.route.snapshot.params['key'];

    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  get f() { return this.resetForm.controls; }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password').value === g.get('confirmPassword').value
      ? null : { matching: true };
  }

  onSubmit() {
    this.submitted = true;

    if (this.resetForm.invalid) {
      return;
    }

    this.loading = true;
    this.userService.sendResetPass({
      id_perso: this.idPerso,
      key: this.key,
      password: this.resetForm.value.password
    }).subscribe({
      next: data => {
        this.loading = false;

        if (data.success) {
          this.formSuccess = true;
          this.formInvalid = false;
        }
        else {
          this.formInvalid = true;
          this.formSuccess = false;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}