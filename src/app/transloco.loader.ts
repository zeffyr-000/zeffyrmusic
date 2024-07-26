import { Injectable } from "@angular/core";
import { Translation, TranslocoLoader } from "@jsverse/transloco";

import en from "src/assets/i18n/en.json";
import fr from "src/assets/i18n/fr.json";

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private translations: Record<string, Translation> = {
    en: en,
    fr: fr
  };

  getTranslation(lang: string) {
    return new Promise<Translation>((resolve) => {
      resolve(this.translations[lang]);
    });
  }
}