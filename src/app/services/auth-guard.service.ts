import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { InitService } from './init.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private initService = inject(InitService);
  private router = inject(Router);


  canActivate(): boolean {
    if (this.initService.getIsConnected()) {
      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
}