import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { TranslocoModule } from '@ngneat/transloco';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HeaderComponent } from './header/header.component';
import { PlayerComponent } from './player/player.component';
import { NgbAlert, NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FacebookModule } from 'ngx-facebook';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { AngularDraggableModule } from 'angular2-draggable';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


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
