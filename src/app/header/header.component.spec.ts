import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import { FacebookModule } from 'ngx-facebook';
import { TranslocoModule } from '@ngneat/transloco';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AngularDraggableModule } from 'angular2-draggable';
import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { ToMMSSPipe } from '../pipes/to-mmss.pipe';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FacebookModule,
                TranslocoModule,
                AngularDraggableModule,
                NgbModule,
                FormsModule,
                ReactiveFormsModule,
                RouterTestingModule,
                HttpClientTestingModule],
      declarations: [ HeaderComponent,
                      SearchBarComponent,
                      ToMMSSPipe ],
      providers: [NgbActiveModal]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
