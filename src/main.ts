import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from './environments/environment';
import {
  LocationStrategy,
  HashLocationStrategy,
  PathLocationStrategy,
  APP_BASE_HREF,
} from '@angular/common';
import { browserConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { InitService } from './app/services/init.service';
import { PlayerService } from './app/services/player.service';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    ...browserConfig.providers,
    { provide: APP_BASE_HREF, useValue: '/' },
    {
      provide: LocationStrategy,
      useClass:
        'standalone' in window.navigator && window.navigator.standalone
          ? HashLocationStrategy
          : PathLocationStrategy,
    },
    InitService,
    PlayerService,
  ],
}).catch(err => console.error(err));
