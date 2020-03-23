import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { FacebookModule } from '@finosofica/ngx-facebook';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { AngularDraggableModule } from 'angular2-draggable';
import { config } from 'rxjs';
import fr from '../../assets/i18n/fr.json';
import { ToMMSSPipe } from '../pipes/to-mmss.pipe';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FacebookModule,
        TranslocoTestingModule.withLangs({ fr },
          {
            availableLangs: ['fr', 'en'],
            defaultLang: 'fr',
            ...config
          }),
        AngularDraggableModule,
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule],
      declarations: [HeaderComponent,
        SearchBarComponent,
        ToMMSSPipe],
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
