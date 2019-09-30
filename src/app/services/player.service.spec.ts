import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslocoModule } from '@ngneat/transloco';
import { PlayerService } from './player.service';

describe('PlayerService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule,
              HttpClientTestingModule,
              TranslocoModule]
  }));

  it('should be created', () => {
    const service: PlayerService = TestBed.get(PlayerService);
    expect(service).toBeTruthy();
  });
});
