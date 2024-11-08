import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyPlaylistsComponent } from './my-playlists.component';
import { PlayerService } from '../services/player.service';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject } from 'rxjs';
import { getTranslocoModule } from '../transloco-testing.module';
import { InitService } from '../services/init.service';
import { AuthGuard } from '../services/auth-guard.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserService } from '../services/user.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

describe('MyPlaylistsComponent', () => {
  let component: MyPlaylistsComponent;
  let fixture: ComponentFixture<MyPlaylistsComponent>;
  let playerServiceMock: PlayerService;
  let translocoService: TranslocoService;
  let initServiceMock: jasmine.SpyObj<InitService>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let initService: InitService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let playerService: PlayerService;
  let userServiceMock: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    playerServiceMock = jasmine.createSpyObj('PlayerService', ['deleteFollow']);
    initServiceMock = jasmine.createSpyObj('InitService', ['loginSuccess', 'logOut', 'onMessageUnlog']);
    userServiceMock = jasmine.createSpyObj('UserService',
      ['register', 'login', 'resetPass', 'editPass', 'editMail', 'createPlaylist', 'logout', 'editTitlePlaylist',
        'editDarkMode', 'editLanguage', 'deleteAccount', 'associateGoogleAccount']);

    const authGuardMock = jasmine.createSpyObj('AuthGuard', ['canActivate']);
    const activeModalSpyObj = jasmine.createSpyObj('NgbActiveModal', ['dismiss']);
    playerServiceMock.subjectListPlaylist = new BehaviorSubject([]);

    initServiceMock.subjectConnectedChange = new BehaviorSubject({
      isConnected: true,
      pseudo: '',
      idPerso: '',
      mail: '',
      darkModeEnabled: false,
      language: 'fr'
    });
    initServiceMock.logOut = jasmine.createSpy('logOut')

    await TestBed.configureTestingModule({
      imports: [getTranslocoModule(), FormsModule],
      declarations: [MyPlaylistsComponent],
      providers: [
        { provide: InitService, useValue: initServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: NgbActiveModal, useValue: activeModalSpyObj },
        { provide: AuthGuard, useValue: authGuardMock },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    initService = TestBed.inject(InitService);
    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
    playerService = TestBed.inject(PlayerService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyPlaylistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the title on init', () => {
    component.ngOnInit();
    expect(component['titleService'].getTitle()).toBe('My playlists - Zeffyr Music');
  });


});