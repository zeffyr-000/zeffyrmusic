import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
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
      providers: [NgbActiveModal],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
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

  it('should have a title', () => {
    const title = fixture.nativeElement.querySelector('h1');
    expect(title.textContent).toContain('My App');
  });

  it('should have a login button', () => {
    const button = fixture.nativeElement.querySelector('#login-button');
    expect(button).toBeTruthy();
  });

  it('should have a register button', () => {
    const button = fixture.nativeElement.querySelector('#register-button');
    expect(button).toBeTruthy();
  });

  it('should have a logout button', () => {
    const button = fixture.nativeElement.querySelector('#logout-button');
    expect(button).toBeFalsy();
  });

  it('should show login modal when login button is clicked', () => {
    const button = fixture.nativeElement.querySelector('#login-button');
    button.click();
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('#login-modal');
    expect(modal).toBeTruthy();
  });

  it('should show register modal when register button is clicked', () => {
    const button = fixture.nativeElement.querySelector('#register-button');
    button.click();
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('#register-modal');
    expect(modal).toBeTruthy();
  });

  it('should hide login and register buttons when user is logged in', () => {
    component.isConnected = true;
    fixture.detectChanges();
    const loginButton = fixture.nativeElement.querySelector('#login-button');
    const registerButton = fixture.nativeElement.querySelector('#register-button');
    expect(loginButton).toBeFalsy();
    expect(registerButton).toBeFalsy();
  });

  it('should show logout button when user is logged in', () => {
    component.isConnected = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('#logout-button');
    expect(button).toBeTruthy();
  });
});
