import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistComponent } from './playlist.component';
import { TranslocoModule } from '@ngneat/transloco';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FacebookModule } from 'ngx-facebook';
import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

describe('PlaylistComponent', () => {
  let component: PlaylistComponent;
  let fixture: ComponentFixture<PlaylistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FacebookModule,
                TranslocoModule,
                RouterTestingModule,
                HttpClientTestingModule,
                NgbModule],
      declarations: [ PlaylistComponent,
                      ToMMSSPipe ]
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
