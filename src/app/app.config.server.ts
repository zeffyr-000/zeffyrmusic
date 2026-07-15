import { provideServerRendering, withRoutes } from '@angular/ssr';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
    // The app is mounted at the root, so the base href is always '/'. Previously
    // supplied per-request by CommonEngine; the SSR engine no longer wires this.
    { provide: APP_BASE_HREF, useValue: '/' },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
