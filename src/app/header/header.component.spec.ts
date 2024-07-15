import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoService } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { FollowItem } from '../models/follow.model';
import { UserPlaylist } from '../models/playlist.model';
import { PlayerService } from '../services/player.service';
import { HeaderComponent } from './header.component';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { InitService } from '../services/init.service';
import { PlayerRunning } from '../models/player-running.model';
import { VideoItem } from '../models/video.model';
import { NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { LoginResponse } from '../models/user.model';
import { getTranslocoModule } from '../transloco-testing.module';

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

  beforeEach(async () => {
    const initServiceMock = jasmine.createSpyObj('InitService', ['loginSuccess', 'logOut', 'onMessageUnlog']);
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
    routeSpyObj = jasmine.createSpyObj('ActivatedRoute', [], { snapshot: { paramMap: { get: () => '1' } } });
    const googleAnalyticsServiceSpyObj = jasmine.createSpyObj('GoogleAnalyticsService', ['pageView']);
    const modalServiceSpyObj = jasmine.createSpyObj('NgbModal', ['open']);
    const activeModalSpyObj = jasmine.createSpyObj('NgbActiveModal', ['dismiss']);

    initServiceMock.subjectConnectedChange = new BehaviorSubject({ isConnected: false, pseudo: '', id_perso: '', mail: '', darkModeEnabled: false });
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

    await TestBed.configureTestingModule({
      imports: [
        NgbModalModule,
        getTranslocoModule()
      ],
      declarations: [HeaderComponent],
      providers: [
        { provide: InitService, useValue: initServiceMock },
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: Router, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: routeSpyObj },
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceSpyObj },
        { provide: NgbModal, useValue: modalServiceSpyObj },
        { provide: NgbActiveModal, useValue: activeModalSpyObj },
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
    const event = { x: 100 };

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

        component.onLogIn(form, activeModalSpy);

        expect(userServiceMock.login).toHaveBeenCalledWith(form.form.value);

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
        const darkModeEnabled = false;
        const language = 'en';

        const loginResponse = { success: true, pseudo, id_perso, mail, dark_mode_enabled: darkModeEnabled, language, liste_playlist, liste_suivi } as LoginResponse;
        userServiceMock.login.and.returnValue(of(loginResponse));

        component.onLogIn(form, activeModalSpy);

        expect(userServiceMock.login).toHaveBeenCalledWith(form.form.value);

        expect(component.isConnected).toBeTrue();
        expect(initService.loginSuccess).toHaveBeenCalledWith(pseudo, id_perso, mail, darkModeEnabled, language);
        expect(component.mail).toBe(mail);
        expect(playerService.onLoadListLogin).toHaveBeenCalledWith(liste_playlist, liste_suivi);
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

        component.onLogIn(form, activeModalSpy);

        expect(userServiceMock.login).toHaveBeenCalledWith(form.form.value);

        expect(component.error).toBe('Invalid credentials');
      });
    });

    describe('onSumbitResetPass', () => {
      it('should call httpClient.post with the correct arguments and update this.isSuccess or this.error based on the server response', () => {
        const form = { valid: true, form: { value: 'testValue' } } as NgForm;
        const successResponse = { success: true, error: '' };
        const errorResponse = { success: false, error: 'Invalid credentials' };

        userServiceMock.resetPass.and.returnValue(of(successResponse));
        spyOn(translocoService, 'translate').and.returnValue('Invalid credentials');

        component.onSubmitResetPass(form);

        expect(userServiceMock.resetPass).toHaveBeenCalledWith(form.form.value);
        expect(component.isSuccess).toBe(true);

        userServiceMock.resetPass.and.returnValue(of(errorResponse));

        component.onSubmitResetPass(form);

        expect(userServiceMock.resetPass).toHaveBeenCalledWith(form.form.value);
        expect(component.error).toBe('Invalid credentials');
      });
    });

    describe('onCreatePlaylist', () => {
      it('should call httpClient.post with the correct arguments and call playerService.addNewPlaylist or update this.error based on the server response', () => {
        // Arrange
        const form = {
          valid: true,
          form: {
            value: {
              playlistName: 'testPlaylist'
            }
          }
        } as NgForm;
        const successResponse = { success: true, id_playlist: '123', titre: 'testPlaylist', error: '' };
        const errorResponse = { success: false, id_playlist: '', titre: '', error: 'Invalid playlist name' };
        userServiceMock.createPlaylist.and.returnValue(of(successResponse));
        spyOn(translocoService, 'translate').and.returnValue('Invalid playlist name');

        // Act
        component.onCreatePlaylist(form);

        // Assert
        expect(userServiceMock.createPlaylist).toHaveBeenCalledWith(form.form.value);
        expect(playerService.addNewPlaylist).toHaveBeenCalledWith('123', 'testPlaylist');

        userServiceMock.createPlaylist.and.returnValue(of(errorResponse));
        // Act
        component.onCreatePlaylist(form);

        // Assert
        expect(userServiceMock.createPlaylist).toHaveBeenCalledWith(form.form.value);
        expect(component.error).toBe('Invalid playlist name');
      });

      it('should set this.isConnected to false and call initService.onMessageUnlog when an error occurs', () => {
        // Arrange
        const form = {
          valid: true,
          form: {
            value: {
              playlistName: 'testPlaylist'
            }
          }
        } as NgForm;
        userServiceMock.createPlaylist.and.returnValue(throwError('error'));

        // Act
        component.onCreatePlaylist(form);

        // Assert
        expect(userServiceMock.createPlaylist).toHaveBeenCalledWith(form.form.value);
        expect(component.isConnected).toBe(false);
        expect(initService.onMessageUnlog).toHaveBeenCalled();
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

  it('should call modal.dismiss and router.navigate with the correct arguments when onCloseModalPlaylists is called', () => {
    // Arrange
    const idPlaylist = '123';
    const modal = jasmine.createSpyObj('NgbActiveModal', ['dismiss', 'update', 'close']);

    // Act
    component.onCloseModalPlaylists(idPlaylist, modal);

    // Assert
    expect(modal.dismiss).toHaveBeenCalled();
    expect(routerSpyObj.navigate).toHaveBeenCalledWith(['/playlist', idPlaylist], { relativeTo: routeSpyObj });
  });

  it('should call playerService.switchVisibilityPlaylist with the correct arguments when onSwitchVisibility is called', () => {
    // Arrange
    const idPlaylist = '123';
    const isPrivate = 'prive';

    // Act
    component.onSwitchVisibility(idPlaylist, isPrivate);

    // Assert
    expect(playerService.switchVisibilityPlaylist).toHaveBeenCalledWith(idPlaylist, true);
  });

  it('should call modalService.open with the correct argument and update this.currentIdPlaylistEdit and this.playlistTitle when onConfirmEditTitlePlaylist is called', () => {
    // Arrange
    const idPlaylist = '123';
    const title = 'newTitle';
    const contentModalConfirmEditTitle = {} as TemplateRef<unknown>;

    // Act
    component.onConfirmEditTitlePlaylist(idPlaylist, title, contentModalConfirmEditTitle);

    // Assert
    expect(modalService.open).toHaveBeenCalledWith(contentModalConfirmEditTitle);
    expect(component.currentIdPlaylistEdit).toBe(idPlaylist);
    expect(component.playlistTitle).toBe(title);
  });

  describe('onEditTitlePlaylist', () => {
    it('should call httpClient.post with the correct arguments and call playerService.editPlaylistTitle and modal.dismiss or update this.error based on the server response', () => {
      // Arrange
      const form = {
        valid: true,
        form: {
          value: {
            playlist_titre: 'newTitle'
          }
        }
      } as NgForm;
      const modal = jasmine.createSpyObj('NgbActiveModal', ['dismiss', 'update', 'close']);
      const successResponse = { success: true, error: '' };
      const errorResponse = { success: false, error: 'Invalid title' };
      const successBody = {
        id_playlist: '123',
        titre: 'newTitle'
      };
      component.currentIdPlaylistEdit = '123';
      userServiceMock.editTitlePlaylist.and.returnValue(of(successResponse));
      spyOn(translocoService, 'translate').and.returnValue('Invalid title');

      // Act
      component.onEditTitlePlaylist(form, modal);

      // Assert
      expect(userServiceMock.editTitlePlaylist).toHaveBeenCalledWith(successBody);
      expect(playerService.editPlaylistTitle).toHaveBeenCalledWith('123', 'newTitle');
      expect(modal.dismiss).toHaveBeenCalled();

      userServiceMock.editTitlePlaylist.and.returnValue(of(errorResponse));

      // Act
      component.onEditTitlePlaylist(form, modal);

      // Assert
      expect(userServiceMock.editTitlePlaylist).toHaveBeenCalledWith(successBody);
      expect(component.error).toBe('Invalid title');
    });

    it('should set this.isConnected to false and call initService.onMessageUnlog when an error occurs', () => {
      // Arrange
      const form = {
        valid: true,
        form: {
          value: {
            playlist_titre: 'newTitle'
          }
        }
      } as NgForm;
      const modal = jasmine.createSpyObj('NgbActiveModal', ['dismiss', 'update', 'close']);
      userServiceMock.editTitlePlaylist.and.returnValue(throwError('error'));

      // Act
      component.onEditTitlePlaylist(form, modal);

      // Assert
      expect(userServiceMock.editTitlePlaylist).toHaveBeenCalled();
      expect(component.isConnected).toBe(false);
      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });
  });

  it('should call modalService.open with the correct argument and update this.currentIdPlaylistEdit when onConfirmDeletePlaylist is called', () => {
    // Arrange
    const idPlaylist = '123';
    const contentModalConfirmDeletePlaylist = {} as TemplateRef<unknown>;

    // Act
    component.onConfirmDeletePlaylist(idPlaylist, contentModalConfirmDeletePlaylist);

    // Assert
    expect(modalService.open).toHaveBeenCalledWith(contentModalConfirmDeletePlaylist);
    expect(component.currentIdPlaylistEdit).toBe(idPlaylist);
  });

  it('should call playerService.deletePlaylist and modal.dismiss with the correct arguments when onDeletePlaylist is called', () => {
    // Arrange
    const modal = jasmine.createSpyObj('NgbActiveModal', ['dismiss', 'update', 'close']);
    component.currentIdPlaylistEdit = '123';

    // Act
    component.onDeletePlaylist(modal);

    // Assert
    expect(playerService.deletePlaylist).toHaveBeenCalledWith('123');
    expect(modal.dismiss).toHaveBeenCalled();
  });

  it('should call playerService.deleteFollow with the correct argument when onDeleteFollow is called', () => {
    // Arrange
    const idPlaylist = '123';

    // Act
    component.onDeleteFollow(idPlaylist);

    // Assert
    expect(playerService.deleteFollow).toHaveBeenCalledWith(idPlaylist);
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
});