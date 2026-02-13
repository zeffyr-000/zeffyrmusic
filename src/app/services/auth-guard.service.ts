import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '../store';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  canActivate(): boolean {
    // Skip auth check on server — let client handle it
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    if (this.authStore.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
}
