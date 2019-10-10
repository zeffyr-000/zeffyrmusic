import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal, NgbAlert, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { AngularDraggableModule } from 'angular2-draggable';
import { FacebookModule } from 'ngx-facebook';
import fr  from '../assets/i18n/fr.json';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { PlayerComponent } from './player/player.component';
import { SearchBarComponent } from './search-bar/search-bar.component';

describe('AppComponent', () => {

  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FacebookModule,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslocoTestingModule.withLangs({fr}),
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

});
