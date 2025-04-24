import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { FontAwesomeTestingModule } from '@fortawesome/angular-fontawesome/testing';
import { FollowItem } from '../models/follow.model';
import { UserPlaylist } from '../models/playlist.model';
import { PlayerService } from '../services/player.service';
import { HeaderComponent } from './header.component';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { InitService } from '../services/init.service';
import { PlayerRunning } from '../models/player-running.model';
import { UserVideo, VideoItem } from '../models/video.model';
import { Component, NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { LoginResponse } from '../models/user.model';
import { getTranslocoModule } from '../transloco-testing.module';
import { environment } from 'src/environments/environment';
import { RouterTestingModule } from '@angular/router/testing';
import { MockTestComponent } from '../mock-test.component';
import { CommonModule } from '@angular/common';
import { SearchService } from '../services/search.service';
import { SearchResults1, SearchResults2, SearchResults3 } from '../models/search.model';

@Component({
  selector: 'app-search-bar',
  template: '',
  standalone: true,
  imports: [CommonModule]
})
class MockSearchBarComponent { }


describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let initService: InitService;
  let playerService: PlayerService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userService: UserService;
  let googleAnalyticsServiceSpy: jasmine.SpyObj<GoogleAnalyticsService>;
  let translocoService: TranslocoService;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;
  let onUpdateSliderPlayerSpy: jasmine.Spy;
  let onUpdateVolumeSpy: jasmine.Spy;
  let modalService: NgbModal;
  let routerSpyObj: jasmine.SpyObj<Router>;
  let routeSpyObj: jasmine.SpyObj<ActivatedRoute>;
  let userServiceMock: jasmine.SpyObj<UserService>;
  let modalServiceSpyObj: jasmine.SpyObj<NgbModal>;
  let initServiceMock: jasmine.SpyObj<InitService>;
  let searchServiceMock: Partial<SearchService>;

  const searchResults1: SearchResults1 = {
    artist: [{ id_artiste: '1', artiste: 'Test Artist', artist: 'Test Artist', id_artiste_deezer: '123' }],
    playlist: [{ id_playlist: '1', artiste: 'Test Artist', ordre: '1', titre: 'Test Album', url_image: '', year_release: 2021 }],
  };
  const searchResults2: SearchResults2 = {
    tab_video: [{
      id_video: '1', artiste: 'Test Artist', artists: [{ id_artist: '1', label: 'Test Artist' }], duree: '100', id_playlist: '1', key: 'XXX-XXX', ordre: '1', titre: 'Test Track', titre_album: 'Test Album'
    }],
  };
  const searchResults3: SearchResults3 = {
    tab_extra: [{ key: 'TEST', title: 'TITLE', duree: 100 }],
  };

  beforeEach(async () => {
    initServiceMock = jasmine.createSpyObj('InitService', ['loginSuccess', 'logOut', 'onMessageUnlog']);
    const playerServiceMock = jasmine.createSpyObj('PlayerService', [
      'switchRepeat',
      'switchRandom',
      'updatePositionSlider',
      'updateVolume',
      'onPlayPause',
      'before',
      'after',
      'onLoadListLogin',
      'updatePositionSlider',
      'addNewPlaylist',
      'switchVisibilityPlaylist',
      'editPlaylistTitle',
      'deleteFollow',
      'deletePlaylist',
      'addVideoInPlaylistRequest'
    ]);
    userServiceMock = jasmine.createSpyObj('UserService', ['register', 'login', 'resetPass', 'editPass', 'editMail', 'createPlaylist', 'logout', 'editTitlePlaylist']);
    routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    routeSpyObj = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        paramMap: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          get: (key: string) => '123',
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          has: (key: string) => true,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          getAll: (key: string) => ['123'],
          keys: ['id']
        }
      }
    });
    const googleAnalyticsServiceSpyObj = jasmine.createSpyObj('GoogleAnalyticsService', ['pageView']);
    modalServiceSpyObj = jasmine.createSpyObj('NgbModal', ['open', 'dismissAll']);
    const activeModalSpyObj = jasmine.createSpyObj('NgbActiveModal', ['dismiss']);

    initServiceMock.subjectConnectedChange = new BehaviorSubject({ isConnected: false, pseudo: '', idPerso: '', mail: '', darkModeEnabled: false, language: 'en' });
    initServiceMock.logOut = jasmine.createSpy('logOut');
    playerServiceMock.subjectRepeatChange = new BehaviorSubject(false);
    playerServiceMock.subjectRandomChange = new BehaviorSubject(false);
    playerServiceMock.subjectIsPlayingChange = new BehaviorSubject(false);
    playerServiceMock.subjectVolumeChange = new BehaviorSubject(0);
    playerServiceMock.subjectPlayerRunningChange = new BehaviorSubject(false);
    playerServiceMock.subjectListPlaylist = new BehaviorSubject([]);
    playerServiceMock.subjectListFollow = new BehaviorSubject([]);
    playerServiceMock.subjectAddVideo = new BehaviorSubject(null);
    playerServiceMock.subjectCurrentKeyChange = new BehaviorSubject('XXXX-XXX');
    playerServiceMock.player = { setVolume: jasmine.createSpy('setVolume') };
    searchServiceMock = {
      fullSearch1: jasmine.createSpy('fullSearch1').and.returnValue(of(searchResults1)),
      fullSearch2: jasmine.createSpy('fullSearch2').and.returnValue(of(searchResults2)),
      fullSearch3: jasmine.createSpy('fullSearch3').and.returnValue(of(searchResults3)),
    };

    await TestBed.configureTestingModule({
      imports: [
        NgbModalModule,
        getTranslocoModule(),
        HeaderComponent,
        FontAwesomeTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'test', component: MockTestComponent },
        ]),
        MockSearchBarComponent
      ],
      providers: [
        { provide: InitService, useValue: initServiceMock },
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: RouterTestingModule, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: routeSpyObj },
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceSpyObj },
        { provide: NgbModal, useValue: modalServiceSpyObj },
        { provide: NgbActiveModal, useValue: activeModalSpyObj },
        {
          provide: SearchService,
          useValue: searchServiceMock,
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    initService = TestBed.inject(InitService);
    playerService = TestBed.inject(PlayerService);
    userService = TestBed.inject(UserService);
    googleAnalyticsServiceSpy = TestBed.inject(GoogleAnalyticsService) as jasmine.SpyObj<GoogleAnalyticsService>;
    activeModalSpy = TestBed.inject(NgbActiveModal) as jasmine.SpyObj<NgbActiveModal>;
    modalService = TestBed.inject(NgbModal);
    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    onUpdateSliderPlayerSpy = spyOn(component, 'onUpdateSliderPlayer');
    onUpdateVolumeSpy = spyOn(component, 'onUpdateVolume');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update values when not dragging player', () => {
    // Préparez les données de test
    const data = {
      slideLength: 100,
      currentTimeStr: '00:01:00',
      totalTimeStr: '00:02:00',
      loadVideo: 1,
    } as PlayerRunning;

    // Assurez-vous que onDragingPlayer est false
    component.onDragingPlayer = false;

    // Créez un espion pour ChangeDetectorRef.detectChanges
    const detectChangesSpy = spyOn(component['ref'], 'detectChanges');

    // Simulez l'émission d'une valeur par subjectPlayerRunningChange
    component.playerService.subjectPlayerRunningChange.next(data);

    // Vérifiez si les valeurs ont été mises à jour correctement
    expect(component.valueSliderPlayer).toBe(data.slideLength);
    expect(component.currentTimeStr).toBe(data.currentTimeStr);
    expect(component.totalTimeStr).toBe(data.totalTimeStr);
    expect(component.loadVideo).toBe(data.loadVideo);

    // Vérifiez si detectChanges a été appelé
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should update values when subjectAddVideo emits', () => {
    // Préparez les données de test
    const data = {
      key: 'XXXX-XXX',
      artist: 'testArtist',
      title: 'testTitle',
      duration: 100,
    } as VideoItem;

    // Créez un espion pour openModal
    const openModalSpy = spyOn(component, 'openModal');

    // Simulez l'émission d'une valeur par subjectAddVideo
    component.playerService.subjectAddVideo.next(data);

    // Vérifiez si les valeurs ont été mises à jour correctement
    expect(component.addKey).toBe(data.key);
    expect(component.addArtist).toBe(data.artist);
    expect(component.addTitle).toBe(data.title);
    expect(component.addDuration).toBe(data.duration);

    // Vérifiez si openModal a été appelé
    expect(openModalSpy).toHaveBeenCalled();
  });

  it('should call requestFullscreen when goFullscreen is called', () => {
    // Créez un faux HTMLElement avec une méthode requestFullscreen espionnée
    const element = jasmine.createSpyObj('HTMLElement', ['requestFullscreen']);

    // Remplacez document.getElementById par une fonction qui renvoie le faux HTMLElement
    spyOn(document, 'getElementById').and.returnValue(element);

    // Appeler goFullscreen
    component.goFullscreen('testId');

    // Vérifiez si getElementById a été appelé avec le bon argument
    expect(document.getElementById).toHaveBeenCalledWith('testId');

    // Vérifiez si requestFullscreen a été appelé sur l'élément
    expect(element.requestFullscreen).toHaveBeenCalled();
  });

  it('should call playerService.switchRepeat when repeat is called', () => {
    component.repeat();

    expect(playerService.switchRepeat).toHaveBeenCalled();
  });

  it('should call playerService.switchRandom when random is called', () => {
    component.random();

    expect(playerService.switchRandom).toHaveBeenCalled();
  });

  it('should call onUpdateSliderPlayer when onDragMovingPlayer is called', () => {
    const event = { x: 100 };

    component.onDragMovingPlayer(event);
    expect(onUpdateSliderPlayerSpy).toHaveBeenCalledWith(event.x);
  });

  it('should call onUpdateSliderPlayer when onDragEndPlayer is called', () => {
    const event = { x: 100 };

    component.onDragEndPlayer(event);
    expect(onUpdateSliderPlayerSpy).toHaveBeenCalledWith(event.x);
  });

  it('should call onUpdateSliderPlayer when onClickSliderPlayer is called', () => {
    const event = { offsetX: 100 };

    component.onClickSliderPlayer(event);
    expect(onUpdateSliderPlayerSpy).toHaveBeenCalledWith(event.offsetX);
  });

  it('should call playerService.updatePositionSlider with 0 when value is less than 0', () => {
    onUpdateSliderPlayerSpy.and.callThrough();
    component.onUpdateSliderPlayer(-10);

    expect(playerService.updatePositionSlider).toHaveBeenCalledWith(0);
  });

  it('should call playerService.updatePositionSlider with 1 when value is greater than size', () => {
    onUpdateSliderPlayerSpy.and.callThrough();
    const size = component.sliderPlayerRef.nativeElement.parentNode.offsetWidth;
    component.onUpdateSliderPlayer(size + 10);

    expect(playerService.updatePositionSlider).toHaveBeenCalledWith(1);
  });


  it('should call player.setVolume when onDragMovingVolume is called', () => {
    const event = { x: 100 };

    component.onDragMovingVolume(event);
    expect(playerService.player.setVolume).toHaveBeenCalledWith(event.x);
  });

  it('should call onUpdateVolume when onDragEndVolume is called', () => {
    const event = { x: 100 };

    component.onDragEndVolume(event);
    expect(onUpdateVolumeSpy).toHaveBeenCalledWith(event.x);
  });

  it('should call onUpdateVolume when onClickSliderVolume is called', () => {
    const event = { x: 100, offsetX: 100 };

    component.onClickSliderVolume(event);
    expect(onUpdateVolumeSpy).toHaveBeenCalledWith(event.x);
  });

  it('should call playerService.onPlayPause when onPlayPause is called', () => {
    component.onPlayPause();

    expect(playerService.onPlayPause).toHaveBeenCalled();
  });

  it('should call playerService.before when onBefore is called', () => {
    component.onBefore();

    expect(playerService.before).toHaveBeenCalled();
  });

  it('should call playerService.after when onAfter is called', () => {
    component.onAfter();

    expect(playerService.after).toHaveBeenCalled();
  });

  it('should expand player', () => {
    component.expandPlayer();
    expect(component.isPlayerExpanded).toBe(true);
  });

  it('should collapse player', () => {
    component.collapsePlayer();
    expect(component.isPlayerExpanded).toBe(false);
  });

  it('should call playerService.updateVolume with the correct argument and update this.valueSliderVolume when onUpdateVolume is called', () => {
    onUpdateVolumeSpy.and.callThrough();
    const value = 50;
    const size = 100;
    spyOn(component.sliderVolumeRef.nativeElement.parentNode, 'offsetWidth').and.returnValue(size);
    component.onUpdateVolume(value);

    expect(playerService.updateVolume).toHaveBeenCalled();
  });

  it('should call playerService.updateVolume with 0 when onUpdateVolume is called with a value less than 0', () => {
    onUpdateVolumeSpy.and.callThrough();
    const value = -10;
    component.onUpdateVolume(value);
    expect(playerService.updateVolume).toHaveBeenCalledWith(0);
    expect(component.valueSliderVolume).toBe(0);
  });

  it('should call playerService.updateVolume with 100 when onUpdateVolume is called with a value greater than size', () => {
    onUpdateVolumeSpy.and.callThrough();
    const value = 200;
    const size = 100;
    spyOn(component.sliderVolumeRef.nativeElement.parentNode, 'offsetWidth').and.returnValue(size);
    component.onUpdateVolume(value);
    expect(playerService.updateVolume).toHaveBeenCalledWith(100);
    expect(component.valueSliderVolume).toBe(100);
  });

  it('should call modalService.open with the correct arguments when openModal is called', () => {
    const content = {} as TemplateRef<unknown>;
    component.openModal(content);
    expect(modalService.open).toHaveBeenCalledWith(content, { size: 'lg' });
  });

  describe('onSubmitRegister', () => {

    afterEach(() => {
      userServiceMock.register.calls.reset();
    });

    it('should call httpClient.post with the correct arguments', () => {
      const form = <NgForm>{
        valid: true,
        form: {
          value: {
            email: 'test@example.com',
            password: 'password',
          }
        }
      };
      const registerResponse = { success: true, error: '' };
      userServiceMock.register.and.returnValue(of(registerResponse));

      component.onSubmitRegister(form);

      expect(userServiceMock.register).toHaveBeenCalledWith(form.form.value);
    });

    it('should set isRegistered to true and call googleAnalyticsService.pageView if the response is successful', () => {
      const form = <NgForm>{
        valid: true,
        form: {
          value: {
            email: 'test@example.com',
            password: 'password',
          }
        }
      };
      const registerResponse = { success: true, error: '' };
      userServiceMock.register.and.returnValue(of(registerResponse));

      component.onSubmitRegister(form);

      expect(userServiceMock.register).toHaveBeenCalledWith(form.form.value);

      expect(component.isRegistered).toBeTrue();
      expect(googleAnalyticsServiceSpy.pageView).toHaveBeenCalledWith('/inscription/succes');
    });

    it('should set error to the translated error message if the response is unsuccessful', () => {
      const form = <NgForm>{
        valid: true,
        form: {
          value: {
            email: 'test@example.com',
            password: 'password',
          }
        }
      };
      const error = 'invalid_email';
      spyOn(translocoService, 'translate').and.returnValue('Invalid email');
      const registerResponse = { success: false, error };
      userServiceMock.register.and.returnValue(of(registerResponse));

      component.onSubmitRegister(form);

      expect(userServiceMock.register).toHaveBeenCalledWith(form.form.value);

      expect(component.error).toBe('Invalid email');
    });

    it('should set error to the genric message if the response is unsuccessful', () => {
      const form = <NgForm>{
        valid: true,
        form: {
          value: {
            email: 'test@example.com',
            password: 'password',
          }
        }
      };
      spyOn(translocoService, 'translate').and.returnValue('generic_error');
      const registerResponse = { success: false, error: '' };
      userServiceMock.register.and.returnValue(of(registerResponse));

      component.onSubmitRegister(form);

      expect(userServiceMock.register).toHaveBeenCalledWith(form.form.value);

      expect(component.error).toBe('generic_error');
    });

    describe('onLogIn', () => {
      afterEach(() => {
        userServiceMock.login.calls.reset();
      });

      it('should call httpClient.post with the correct arguments', () => {
        const form = <NgForm>{
          valid: true,
          form: {
            value: {
              email: 'test@example.com',
              password: 'password',
            }
          }
        };

        const loginResponse = { success: true, pseudo: '', id_perso: '', mail: '', dark_mode_enabled: false, liste_playlist: [], liste_suivi: [] } as LoginResponse;
        userServiceMock.login.and.returnValue(of(loginResponse));

        component.onLogIn(form, activeModalSpy, null);

        expect(userServiceMock.login).toHaveBeenCalledWith(form.form.value, null);

        expect(component.isConnected).toBeTrue();
        expect(initService.loginSuccess).toHaveBeenCalled();
        expect(playerService.onLoadListLogin).toHaveBeenCalled();
      });

      it('should set isConnected to true, call initService.loginSuccess, set mail, call playerService.onLoadListLogin, and dismiss the modal if the response is successful', () => {
        const form = <NgForm>{
          valid: true,
          form: {
            value: {
              email: 'test@example.com',
              password: 'password',
            }
          }
        };
        const pseudo = 'testuser';
        const id_perso = '123';
        const mail = 'testuser@example.com';
        const liste_playlist: UserPlaylist[] = [];
        const liste_suivi: FollowItem[] = [];
        const like_video: UserVideo[] = [];
        const darkModeEnabled = false;
        const language = 'en';

        const loginResponse = { success: true, pseudo, id_perso, mail, dark_mode_enabled: darkModeEnabled, language, liste_playlist, liste_suivi, like_video } as LoginResponse;
        userServiceMock.login.and.returnValue(of(loginResponse));

        component.onLogIn(form, activeModalSpy, null);

        expect(userServiceMock.login).toHaveBeenCalledWith(form.form.value, null);

        expect(component.isConnected).toBeTrue();
        expect(initService.loginSuccess).toHaveBeenCalledWith(pseudo, id_perso, mail, darkModeEnabled, language);
        expect(component.mail).toBe(mail);
        expect(playerService.onLoadListLogin).toHaveBeenCalledWith(liste_playlist, liste_suivi, like_video);
        expect(activeModalSpy.dismiss).toHaveBeenCalledWith('');
      });

      it('should set error to the translated error message if the response is unsuccessful', () => {
        const form = <NgForm>{
          valid: true,
          form: {
            value: {
              email: 'test@example.com',
              password: 'password',
            }
          },
        };
        const error = 'invalid_credentials';
        spyOn(translocoService, 'translate').and.returnValue('Invalid credentials');

        const loginResponse = { success: false, error } as LoginResponse;
        userServiceMock.login.and.returnValue(of(loginResponse));

        component.onLogIn(form, activeModalSpy, null);

        expect(userServiceMock.login).toHaveBeenCalledWith(form.form.value, null);

        expect(component.error).toBe('Invalid credentials');
      });

      it('should set error to the generic error message if the response is unsuccessful', () => {
        const form = <NgForm>{
          valid: true,
          form: {
            value: {
              email: 'test@example.com',
              password: 'password',
            }
          },
        };
        spyOn(translocoService, 'translate').and.returnValue('generic_error');

        const loginResponse = { success: false, error: '' } as LoginResponse;
        userServiceMock.login.and.returnValue(of(loginResponse));

        component.onLogIn(form, activeModalSpy, null);

        expect(userServiceMock.login).toHaveBeenCalledWith(form.form.value, null);

        expect(component.error).toBe('generic_error');
      });

      it('should set isConnected to true, call initService.loginSuccess, set mail, call playerService.onLoadListLogin, and dismiss all modals if the response is successful', () => {
        const form = <NgForm>{
          valid: true,
          form: {
            value: {
              email: 'test@example.com',
              password: 'password',
            }
          }
        };
        const pseudo = 'testuser';
        const id_perso = '123';
        const mail = 'testuser@example.com';
        const liste_playlist: UserPlaylist[] = [];
        const liste_suivi: FollowItem[] = [];
        const darkModeEnabled = false;
        const language = 'en';

        const loginResponse = { success: true, pseudo, id_perso, mail, dark_mode_enabled: darkModeEnabled, language, liste_playlist, liste_suivi } as LoginResponse;
        userServiceMock.login.and.returnValue(of(loginResponse));

        component.onLogIn(form, null, null);

        expect(userServiceMock.login).toHaveBeenCalledWith(form.form.value, null);

        expect(component.isConnected).toBeTrue();
        expect(initService.loginSuccess).toHaveBeenCalledWith(pseudo, id_perso, mail, darkModeEnabled, language);
        expect(modalServiceSpyObj.dismissAll).toHaveBeenCalled();
      });
    });

    describe('onSumbitResetPass', () => {
      it('should call httpClient.post with the correct arguments and update this.isSuccess or this.error based on the server response', () => {
        const form = { valid: true, form: { value: 'testValue' } } as NgForm;
        const successResponse = { success: true, error: '' };
        const errorResponse = { success: false, error: 'Invalid credentials' };
        const errorResponse2 = { success: false, error: '' };

        userServiceMock.resetPass.and.returnValue(of(successResponse));
        spyOn(translocoService, 'translate').and.returnValue('Invalid credentials');

        component.onSubmitResetPass(form);

        expect(userServiceMock.resetPass).toHaveBeenCalledWith(form.form.value);
        expect(component.isSuccess).toBe(true);

        userServiceMock.resetPass.and.returnValue(of(errorResponse));

        component.onSubmitResetPass(form);

        expect(userServiceMock.resetPass).toHaveBeenCalledWith(form.form.value);
        expect(component.error).toBe('Invalid credentials');

        userServiceMock.resetPass.and.returnValue(of(errorResponse2));
        component.onSubmitResetPass(form);

        expect(userServiceMock.resetPass).toHaveBeenCalledWith(form.form.value);
        expect(component.error).toBe('Invalid credentials');
      });
    });

    describe('onLogout', () => {
      it('should call httpClient.get with the correct arguments', () => {
        const successResponse = { success: true, error: '' };
        userServiceMock.logout.and.returnValue(of(successResponse));
        component.onLogout();

        expect(userServiceMock.logout).toHaveBeenCalled();
      });

      it('should call initService.logOut if the response is successful', () => {
        const successResponse = { success: true, error: '' };
        userServiceMock.logout.and.returnValue(of(successResponse));
        component.onLogout();

        expect(userServiceMock.logout).toHaveBeenCalled();
        expect(initService.logOut).toHaveBeenCalled();
      });
    });
  });

  it('should call playerService.addVideoInPlaylistRequest and modal.dismiss with the correct arguments when onAddVideo is called', () => {
    // Arrange
    const idPlaylist = '123';
    const modal = jasmine.createSpyObj('NgbActiveModal', ['dismiss', 'update', 'close']);
    component.addKey = 'key';
    component.addTitle = 'title';
    component.addArtist = 'artist';
    component.addDuration = 100;

    // Act
    component.onAddVideo(idPlaylist, modal);

    // Assert
    expect(playerService.addVideoInPlaylistRequest).toHaveBeenCalledWith(idPlaylist, 'key', 'title', 'artist', 100);
    expect(modal.dismiss).toHaveBeenCalled();
  });

  it('should open modal and call renderGoogleSignInButton', () => {
    const modalRefSpyObj = jasmine.createSpyObj('NgbModalRef', ['result']);
    modalRefSpyObj.result = of().toPromise();
    modalServiceSpyObj.open.and.returnValue(modalRefSpyObj);

    spyOn(component, 'renderGoogleSignInButton');

    component.openModalLogin();

    expect(modalServiceSpyObj.open).toHaveBeenCalledWith(component.contentModalLogin, { size: 'lg' });
  });

  it('should initialize and render Google Sign-In button', () => {
    const google = {
      accounts: {
        id: {
          initialize: jasmine.createSpy('initialize'),
          renderButton: jasmine.createSpy('renderButton')
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = google;

    const mockElement = document.createElement('div');
    mockElement.id = 'google-signin-button-header';
    document.body.appendChild(mockElement);

    component.renderGoogleSignInButton();

    expect(google.accounts.id.initialize).toHaveBeenCalledWith({
      client_id: environment.GOOGLE_CLIENT_ID,
      callback: jasmine.any(Function)
    });
    expect(google.accounts.id.renderButton).toHaveBeenCalledWith(
      mockElement,
      {}
    );

    document.body.removeChild(mockElement);
  });

  it('should initialize and render Google Register button', () => {
    const google = {
      accounts: {
        id: {
          initialize: jasmine.createSpy('initialize'),
          renderButton: jasmine.createSpy('renderButton')
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = google;

    const mockElement = document.createElement('div');
    mockElement.id = 'google-register-button-header';
    document.body.appendChild(mockElement);

    component.renderGoogleRegisterButton();

    expect(google.accounts.id.initialize).toHaveBeenCalledWith({
      client_id: environment.GOOGLE_CLIENT_ID,
      callback: jasmine.any(Function)
    });
    expect(google.accounts.id.renderButton).toHaveBeenCalledWith(
      mockElement,
      {}
    );

    document.body.removeChild(mockElement);
  });

  it('should open modal and call renderGoogleRegisterButton', () => {
    const modalRefSpyObj = jasmine.createSpyObj('NgbModalRef', ['result']);
    modalRefSpyObj.result = Promise.resolve();
    modalServiceSpyObj.open.and.returnValue(modalRefSpyObj);

    spyOn(component, 'renderGoogleRegisterButton');
    jasmine.clock().install();

    component.openModalRegister();

    expect(modalServiceSpyObj.open).toHaveBeenCalledWith(component.contentModalRegister, { size: 'lg' });

    jasmine.clock().tick(1);
    expect(component.renderGoogleRegisterButton).toHaveBeenCalled();

    Promise.resolve().then(() => {
      expect(component.renderGoogleRegisterButton).toHaveBeenCalledTimes(2);
    });

    jasmine.clock().uninstall();
  });

  it('should handle case when google is undefined in renderGoogleRegisterButton', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalGoogle = (window as any).google;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).google = undefined;

      expect(() => {
        component.renderGoogleRegisterButton();
      }).not.toThrow();

    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).google = originalGoogle;
    }
  });

  it('should handle case when google.accounts is undefined in renderGoogleRegisterButton', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalGoogle = (window as any).google;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).google = {};

      expect(() => {
        component.renderGoogleRegisterButton();
      }).not.toThrow();

    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).google = originalGoogle;
    }
  });

  it('should handle case when google.accounts.id is undefined in renderGoogleRegisterButton', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalGoogle = (window as any).google;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).google = {
        accounts: {}
      };

      expect(() => {
        component.renderGoogleRegisterButton();
      }).not.toThrow();

    } finally {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).google = originalGoogle;
    }
  });

  it('should handle case when document.getElementById returns null in renderGoogleRegisterButton', () => {
    const google = {
      accounts: {
        id: {
          initialize: jasmine.createSpy('initialize'),
          renderButton: jasmine.createSpy('renderButton')
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = google;

    spyOn(document, 'getElementById').and.returnValue(null);

    expect(() => {
      component.renderGoogleRegisterButton();
    }).not.toThrow();

    expect(google.accounts.id.initialize).toHaveBeenCalled();

    expect(google.accounts.id.renderButton).toHaveBeenCalledWith(null, {});
  });

  it('should call renderGoogleRegisterButton when modal is dismissed', () => {
    const modalRefSpyObj = jasmine.createSpyObj('NgbModalRef', ['result']);
    modalRefSpyObj.result = Promise.reject();
    modalServiceSpyObj.open.and.returnValue(modalRefSpyObj);

    spyOn(component, 'renderGoogleRegisterButton');

    component.openModalRegister();

    expect(modalServiceSpyObj.open).toHaveBeenCalled();

    Promise.reject().catch(() => {

    }).then(() => {
      expect(component.renderGoogleRegisterButton).toHaveBeenCalled();
    });
  });

  it('should call onLogIn with the correct arguments when handleCredentialResponse is called', () => {
    spyOn(component, 'onLogIn');

    const mockResponse = { credential: 'mockCredential' };

    component.handleCredentialResponse(mockResponse);

    expect(component.onLogIn).toHaveBeenCalledWith(null, null, 'mockCredential');
  });

  it('should react to darkModeEnabled being true', () => {
    initServiceMock.subjectConnectedChange.next({ isConnected: false, pseudo: '', idPerso: '', mail: '', darkModeEnabled: true, language: 'en' });

    fixture.detectChanges();

    expect(document.body.getAttribute('data-bs-theme')).toBe('dark');
  });
});