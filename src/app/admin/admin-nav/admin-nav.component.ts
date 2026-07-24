import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-admin-nav',
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.scss',
  imports: [RouterLink, RouterLinkActive, TranslocoPipe],
})
export class AdminNavComponent {}
