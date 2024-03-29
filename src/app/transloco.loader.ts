import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Translation, TRANSLOCO_LOADER, TranslocoLoader } from '@ngneat/transloco';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpLoader implements TranslocoLoader {
  constructor(private readonly http: HttpClient) {}

  getTranslation(langPath: string) {
    return this.http.get<Translation>(`${environment.URL_ASSETS}assets/i18n/${langPath}.json`);
  }
}

export const translocoLoader = { provide: TRANSLOCO_LOADER, useClass: HttpLoader };

