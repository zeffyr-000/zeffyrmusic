import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { config } from 'rxjs';
import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
import { PlaylistComponent } from './playlist.component';

describe('PlaylistComponent', () => {
  let component: PlaylistComponent;
  let fixture: ComponentFixture<PlaylistComponent>;

  beforeEach(waitForAsync(() => {
    describe('PlaylistComponent', () => {
      let component: PlaylistComponent;
      let fixture: ComponentFixture<PlaylistComponent>;

      beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
          imports: [
            TranslocoTestingModule.withLoader(TranslocoHttpLoader, {
              availableLangs: ['fr', 'en'],
              defaultLang: 'fr',
              ...config
            }),
            RouterTestingModule,
            HttpClientTestingModule,
            NgbModule
          ],
          declarations: [
            PlaylistComponent,
            ToMMSSPipe
          ]
        }).compileComponents();
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
