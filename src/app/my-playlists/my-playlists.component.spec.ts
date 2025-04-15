import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyPlaylistsComponent } from './my-playlists.component';
import { PlayerService } from '../services/player.service';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, of } from 'rxjs';
import { getTranslocoModule } from '../transloco-testing.module';
import { InitService } from '../services/init.service';
import { AuthGuard } from '../services/auth-guard.service';
import { NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, NgForm } from '@angular/forms';
import { CreatePlaylistResponse } from '../models/user.model';

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
  let modalServiceMock: jasmine.SpyObj<NgbActiveModal>;
  let activeModalSpyObj: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    playerServiceMock = jasmine.createSpyObj('PlayerService', ['addNewPlaylist', 'switchVisibilityPlaylist', 'deletePlaylist', 'editPlaylistTitle']);
    initServiceMock = jasmine.createSpyObj('InitService', ['loginSuccess', 'logOut', 'onMessageUnlog']);
    userServiceMock = jasmine.createSpyObj('UserService', ['createPlaylist', 'editTitlePlaylist']);
    modalServiceMock = jasmine.createSpyObj('NgbModal', ['open']);

    const authGuardMock = jasmine.createSpyObj('AuthGuard', ['canActivate']);
    activeModalSpyObj = jasmine.createSpyObj('NgbActiveModal', ['dismiss']);
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
      imports: [getTranslocoModule(), FormsModule, MyPlaylistsComponent],
      providers: [
        { provide: InitService, useValue: initServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: NgbActiveModal, useValue: activeModalSpyObj },
        { provide: AuthGuard, useValue: authGuardMock },
        { provide: NgbModal, useValue: modalServiceMock },
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

  it('should call createPlaylist and addNewPlaylist on valid form submission', () => {
    const form = <NgForm>{
      valid: true,
      form: { value: { titre: 'New Playlist' } }
    };

    const response = { success: true, id_playlist: '1', titre: 'New Playlist', error: '' };
    userServiceMock.createPlaylist.and.returnValue(of(response));

    component.onCreatePlaylist(form);

    expect(userServiceMock.createPlaylist).toHaveBeenCalledWith({ titre: 'New Playlist' });
    expect(playerServiceMock.addNewPlaylist).toHaveBeenCalledWith('1', 'New Playlist');
  });

  it('should set error message on failed playlist creation', () => {
    const form = <NgForm>{
      valid: true,
      form: { value: { titre: 'New Playlist' } }
    };

    const response = { success: false, error: 'error_message' } as CreatePlaylistResponse;
    userServiceMock.createPlaylist.and.returnValue(of(response));

    component.onCreatePlaylist(form);

    expect(userServiceMock.createPlaylist).toHaveBeenCalledWith({ titre: 'New Playlist' });
    expect(component.error).toBe('error_message');
  });

  it('should set generic message on failed playlist creation', () => {
    const form = <NgForm>{
      valid: true,
      form: { value: { titre: 'New Playlist' } }
    };

    const response = { success: false, } as CreatePlaylistResponse;
    userServiceMock.createPlaylist.and.returnValue(of(response));

    component.onCreatePlaylist(form);

    expect(userServiceMock.createPlaylist).toHaveBeenCalledWith({ titre: 'New Playlist' });
  });

  it('should call switchVisibilityPlaylist on playerService with correct parameters', () => {
    const idPlaylist = '1';
    const isPrivate = 'prive';

    component.onSwitchVisibility(idPlaylist, isPrivate);

    expect(playerServiceMock.switchVisibilityPlaylist).toHaveBeenCalledWith(idPlaylist, true);
  });

  it('should call switchVisibilityPlaylist on playerService with correct parameters when not private', () => {
    const idPlaylist = '1';
    const isPrivate = 'public';

    component.onSwitchVisibility(idPlaylist, isPrivate);

    expect(playerServiceMock.switchVisibilityPlaylist).toHaveBeenCalledWith(idPlaylist, false);
  });

  it('should open modal and set currentIdPlaylistEdit and playlistTitle', () => {
    const idPlaylist = '1';
    const title = 'New Playlist Title';
    const contentModalConfirmEditTitle = {} as TemplateRef<unknown>;

    component.onConfirmEditTitlePlaylist(idPlaylist, title, contentModalConfirmEditTitle);

    expect(component.modalService.open).toHaveBeenCalledWith(contentModalConfirmEditTitle);
    expect(component.currentIdPlaylistEdit).toBe(idPlaylist);
    expect(component.playlistTitle).toBe(title);
  });

  it('should open modal and set currentIdPlaylistEdit', () => {
    const idPlaylist = '1';
    const contentModalConfirmDeletePlaylist = {} as TemplateRef<unknown>;

    component.onConfirmDeletePlaylist(idPlaylist, contentModalConfirmDeletePlaylist);

    expect(component.modalService.open).toHaveBeenCalledWith(contentModalConfirmDeletePlaylist);
    expect(component.currentIdPlaylistEdit).toBe(idPlaylist);
  });

  it('should call deletePlaylist on playerService and dismiss the modal', () => {
    component.currentIdPlaylistEdit = '1';

    component.onDeletePlaylist(activeModalSpyObj);

    expect(playerServiceMock.deletePlaylist).toHaveBeenCalledWith('1');
    expect(activeModalSpyObj.dismiss).toHaveBeenCalled();
  });

  it('should call editTitlePlaylist on userService and editPlaylistTitle on playerService, then dismiss the modal on success', () => {
    const form = <NgForm>{
      valid: true,
      form: { value: { playlist_titre: 'Updated Playlist Title' } }
    };
    const response = { success: true, error: undefined } as CreatePlaylistResponse;

    userServiceMock.editTitlePlaylist.and.returnValue(of(response));
    component.currentIdPlaylistEdit = '1';

    component.onEditTitlePlaylist(form, activeModalSpyObj);

    expect(userServiceMock.editTitlePlaylist).toHaveBeenCalledWith({
      id_playlist: '1',
      titre: 'Updated Playlist Title'
    });
    expect(playerServiceMock.editPlaylistTitle).toHaveBeenCalledWith('1', 'Updated Playlist Title');
    expect(activeModalSpyObj.dismiss).toHaveBeenCalled();
  });

  it('should set error message on failed playlist title update', () => {
    const form = <NgForm>{
      valid: true,
      form: { value: { playlist_titre: 'Updated Playlist Title' } }
    };
    const response = { success: false, error: 'error_message' } as CreatePlaylistResponse;

    userServiceMock.editTitlePlaylist.and.returnValue(of(response));
    component.currentIdPlaylistEdit = '1';

    component.onEditTitlePlaylist(form, activeModalSpyObj);

    expect(userServiceMock.editTitlePlaylist).toHaveBeenCalledWith({
      id_playlist: '1',
      titre: 'Updated Playlist Title'
    });
    expect(component.error).toBe('error_message');
  });

  it('should set generic message on failed playlist title update', () => {
    const form = <NgForm>{
      valid: true,
      form: { value: { playlist_titre: 'Updated Playlist Title' } }
    };
    const response = { success: false } as CreatePlaylistResponse;

    userServiceMock.editTitlePlaylist.and.returnValue(of(response));
    component.currentIdPlaylistEdit = '1';

    component.onEditTitlePlaylist(form, activeModalSpyObj);

    expect(userServiceMock.editTitlePlaylist).toHaveBeenCalledWith({
      id_playlist: '1',
      titre: 'Updated Playlist Title'
    });
  });

});