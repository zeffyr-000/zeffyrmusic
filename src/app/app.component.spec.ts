import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal, NgbAlert, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoModule } from '@ngneat/transloco';
import { AngularDraggableModule } from 'angular2-draggable';
import { FacebookModule } from 'ngx-facebook';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { PlayerComponent } from './player/player.component';
import { SearchBarComponent } from './search-bar/search-bar.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FacebookModule,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslocoModule,
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
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

});
