import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchComponent } from './search.component';
import { TranslocoModule } from '@ngneat/transloco';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [TranslocoModule,
                RouterTestingModule,
                HttpClientTestingModule,
                NgbModule],
      declarations: [ SearchComponent,
                      ToMMSSPipe ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
