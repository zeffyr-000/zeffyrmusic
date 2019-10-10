import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslocoTestingModule } from '@ngneat/transloco';
import fr  from '../../assets/i18n/fr.json';
import { InitService } from './init.service';

describe('InitService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule,
              HttpClientTestingModule,
              TranslocoTestingModule.withLangs({fr})]
  }));

  it('should be created', () => {
    const service: InitService = TestBed.get(InitService);
    expect(service).toBeTruthy();
  });
});
