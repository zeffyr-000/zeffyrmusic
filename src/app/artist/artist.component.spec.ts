import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TranslocoTestingModule } from '@ngneat/transloco';
import { config } from 'rxjs';
import fr  from '../../assets/i18n/fr.json';
import { environment } from '../../environments/environment';
import { ArtistComponent } from './artist.component';

describe('ArtistComponent', () => {
  let artistComponent: ArtistComponent;
  let fixture: ComponentFixture<ArtistComponent>;
  let http: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoTestingModule.withLangs({fr},
                                                  {
                                                    availableLangs: ['fr', 'en'],
                                                    defaultLang: 'fr',
                                                    ...config
                                                  }),
                RouterTestingModule,
                HttpClientTestingModule],
      declarations: [ArtistComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArtistComponent);
    artistComponent = fixture.componentInstance;

    http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
  });

  it('should create ArtistComponent', () => {
    expect(artistComponent).toBeTruthy();
  });
/*
  it('should return an Observable of 3 races', () => {
    // fake response
    const hardcodedRaces = [{ name: 'Paris' }, { name: 'Tokyo' }, { name: 'Lyon' }] as any[];

    artistComponent.initLoad();

    http.expectOne(`${environment.URL_SERVER}races?status=PENDING`).flush(hardcodedRaces);
  });
*/
});
