import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FacebookModule } from '@finosofica/ngx-facebook';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { config } from 'rxjs';
import fr from '../../assets/i18n/fr.json';
import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
import { PlaylistComponent } from './playlist.component';

describe('PlaylistComponent', () => {
  let component: PlaylistComponent;
  let fixture: ComponentFixture<PlaylistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FacebookModule,
        TranslocoTestingModule.withLangs({ fr },
          {
            availableLangs: ['fr', 'en'],
            defaultLang: 'fr',
            ...config
          }),
        RouterTestingModule,
        HttpClientTestingModule,
        NgbModule],
      declarations: [PlaylistComponent,
        ToMMSSPipe]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
