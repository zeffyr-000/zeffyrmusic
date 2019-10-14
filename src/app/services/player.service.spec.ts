import { TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { config } from 'rxjs';
import fr from '../../assets/i18n/fr.json';
import { PlayerService } from './player.service';

describe('PlayerService', () => {


  let service: PlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule,
        HttpClientTestingModule,
        TranslocoTestingModule.withLangs({ fr },
          {
            availableLangs: ['fr', 'en'],
            defaultLang: 'fr',
            ...config
          })]
    });
    service = TestBed.get(PlayerService);
  }

  
  );

it('should be created', () => {
  expect(service).toBeTruthy();
});

it('#finvideo', () => {
  service.finvideo(0);
  expect(service.isPlaying).toBe(false);
});

});
