import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from './environments/environment';
import {
  LocationStrategy,
  HashLocationStrategy,
  PathLocationStrategy,
  APP_BASE_HREF,
} from '@angular/common';
import { browserConfig, browserConfigStandalone } from './app/app.config';
import { AppComponent } from './app/app.component';
import { InitService } from './app/services/init.service';
import { PlayerService } from './app/services/player.service';

if (environment.production) {
  enableProdMode();
}

// Detect standalone PWA mode (iOS home screen, Samsung Browser app mode)
const isStandalonePwa =
  ('standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone: boolean }).standalone) ||
  window.matchMedia('(display-mode: standalone)').matches;

// Use different config for standalone PWA:
// - No hydration (SSR uses PathLocationStrategy, but standalone needs HashLocationStrategy)
// - Fresh bootstrap avoids hydration mismatch that causes app to become unresponsive
const config = isStandalonePwa ? browserConfigStandalone : browserConfig;

bootstrapApplication(AppComponent, {
  providers: [
    ...config.providers,
    { provide: APP_BASE_HREF, useValue: '/' },
    {
      provide: LocationStrategy,
      useClass: isStandalonePwa ? HashLocationStrategy : PathLocationStrategy,
    },
    InitService,
    PlayerService,
  ],
}).catch(err => console.error(err));
