import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { config } from 'rxjs';
import fr from '../../assets/i18n/fr.json';
import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
import { PlaylistComponent } from './playlist.component';

describe('PlaylistComponent', () => {
  let component: PlaylistComponent;
  let fixture: ComponentFixture<PlaylistComponent>;

  beforeEach(waitForAsync(() => {
    import { TranslocoTestingModule, TranslocoLoader } from '@ngneat/transloco';
    import { HttpClientTestingModule } from '@angular/common/http/testing';
    import { RouterTestingModule } from '@angular/router/testing';
    import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
    import { config } from 'rxjs';
    import fr from '../../assets/i18n/fr.json';
    import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
    import { PlaylistComponent } from './playlist.component';

    describe('PlaylistComponent', () => {
      let component: PlaylistComponent;
      let fixture: ComponentFixture<PlaylistComponent>;

      beforeEach(waitForAsync(() => {
        import { HttpClientTestingModule } from '@angular/common/http/testing';
        import { RouterTestingModule } from '@angular/router/testing';
        import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
        import { config } from 'rxjs';
        import fr from '../../assets/i18n/fr.json';
        import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
        import { PlaylistComponent } from './playlist.component';
        import { TranslocoTestingModule, TranslocoHttpLoader } from '@ngneat/transloco';

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
