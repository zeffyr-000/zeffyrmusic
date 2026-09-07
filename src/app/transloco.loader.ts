import { Service } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

import en from 'src/assets/i18n/en.json';
import fr from 'src/assets/i18n/fr.json';

@Service()
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly translations: Record<string, Translation> = {
    en: en,
    fr: fr,
  };

  getTranslation(lang: string) {
    return Promise.resolve(this.translations[lang]);
  }
}
