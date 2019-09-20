import { TestBed } from '@angular/core/testing';

import { InitService } from './init.service';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoModule } from '@ngneat/transloco';

describe('InitService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule,
              HttpClientTestingModule,
              TranslocoModule]
  }));

  it('should be created', () => {
    const service: InitService = TestBed.get(InitService);
    expect(service).toBeTruthy();
  });
});
