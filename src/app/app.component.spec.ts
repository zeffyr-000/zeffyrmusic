import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal, NgbAlert, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { AngularDraggableModule } from 'angular2-draggable';
import { config } from 'rxjs';
import fr  from '../assets/i18n/fr.json';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { PlayerComponent } from './player/player.component';
import { SearchBarComponent } from './search-bar/search-bar.component';

describe('AppComponent', () => {

  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        TranslocoTestingModule.withLangs({fr},
          {
            availableLangs: ['fr', 'en'],
            defaultLang: 'fr',
            ...config
          }),
        NgbModule,
        AngularDraggableModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [
        AppComponent,
        HeaderComponent,
        PlayerComponent,
        SearchBarComponent
      ],
      providers: [NgbAlert,
                  NgbActiveModal]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.debugElement.componentInstance;
    fixture.detectChanges();
  }));

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have a router outlet', () => {
    const element = fixture.nativeElement;
    const routerOutlet = element.querySelector('router-outlet');
    expect(routerOutlet)
      .withContext('You need a RouterOutlet component in your root component')
      .not.toBeNull();
  });

  it('should use the header component', () => {
    const element = fixture.debugElement;
    expect(element.query(By.directive(HeaderComponent)))
      .withContext('You probably forgot to add HeaderComponent to the AppComponent template')
      .not.toBeNull();
  });

});
