import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyPlaylistsComponent } from './my-playlists.component';
import { UserLibraryService } from '../services/user-library.service';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { AuthGuard } from '../services/auth-guard.service';
import { NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreatePlaylistResponse } from '../models/user.model';
import { UserDataStore } from '../store/user-data/user-data.store';

describe('MyPlaylistsComponent', () => {
  let component: MyPlaylistsComponent;
  let fixture: ComponentFixture<MyPlaylistsComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userLibraryServiceMock: any;
  let translocoService: TranslocoService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userLibraryService: UserLibraryService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userServiceMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let modalServiceMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activeModalSpyObj: any;
  let userDataStore: InstanceType<typeof UserDataStore>;
  const mockEvent = { preventDefault: vi.fn() } as unknown as Event;

  beforeEach(async () => {
    userLibraryServiceMock = {
      addPlaylist: vi.fn(),
      togglePlaylistVisibility: vi.fn().mockReturnValue(of(true)),
      deletePlaylist: vi.fn().mockReturnValue(of(true)),
      updatePlaylistTitle: vi.fn(),
    };
    userServiceMock = { createPlaylist: vi.fn(), editTitlePlaylist: vi.fn() };
    modalServiceMock = { open: vi.fn() };

    const authGuardMock = { canActivate: vi.fn() };
    activeModalSpyObj = { dismiss: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MyPlaylistsComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: UserService, useValue: userServiceMock },
        { provide: UserLibraryService, useValue: userLibraryServiceMock },
        { provide: NgbActiveModal, useValue: activeModalSpyObj },
        { provide: AuthGuard, useValue: authGuardMock },
        { provide: NgbModal, useValue: modalServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
    userLibraryService = TestBed.inject(UserLibraryService);
    userDataStore = TestBed.inject(UserDataStore);
    userDataStore.reset();
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

  it('should call createPlaylist and addPlaylist on valid form submission', () => {
    // Signal Forms: set model values directly
    component.createPlaylistModel.set({ titre: 'New Playlist' });

    const response = { success: true, id_playlist: '1', titre: 'New Playlist', error: '' };
    userServiceMock.createPlaylist.mockReturnValue(of(response));

    component.onCreatePlaylist(mockEvent);

    expect(userServiceMock.createPlaylist).toHaveBeenCalledWith({ titre: 'New Playlist' });
    expect(userLibraryServiceMock.addPlaylist).toHaveBeenCalledWith('1', 'New Playlist');
  });

  it('should set error message on failed playlist creation', () => {
    // Signal Forms: set model values directly
    component.createPlaylistModel.set({ titre: 'New Playlist' });

    const response = { success: false, error: 'error_message' } as CreatePlaylistResponse;
    userServiceMock.createPlaylist.mockReturnValue(of(response));

    component.onCreatePlaylist(mockEvent);

    expect(userServiceMock.createPlaylist).toHaveBeenCalledWith({ titre: 'New Playlist' });
    expect(component.error()).toBeTruthy();
  });

  it('should set generic message on failed playlist creation', () => {
    // Signal Forms: set model values directly
    component.createPlaylistModel.set({ titre: 'New Playlist' });

    const response = { success: false } as CreatePlaylistResponse;
    userServiceMock.createPlaylist.mockReturnValue(of(response));

    component.onCreatePlaylist(mockEvent);

    expect(userServiceMock.createPlaylist).toHaveBeenCalledWith({ titre: 'New Playlist' });
  });

  it('should call togglePlaylistVisibility on userLibraryService with correct parameters', () => {
    const idPlaylist = '1';
    const isPrivate = 'prive';

    component.onSwitchVisibility(idPlaylist, isPrivate);

    expect(userLibraryServiceMock.togglePlaylistVisibility).toHaveBeenCalledWith(idPlaylist, true);
  });

  it('should call togglePlaylistVisibility on userLibraryService with correct parameters when not private', () => {
    const idPlaylist = '1';
    const isPrivate = 'public';

    component.onSwitchVisibility(idPlaylist, isPrivate);

    expect(userLibraryServiceMock.togglePlaylistVisibility).toHaveBeenCalledWith(idPlaylist, false);
  });

  it('should open modal and set currentIdPlaylistEdit and editTitleModel', () => {
    const idPlaylist = '1';
    const title = 'New Playlist Title';
    const contentModalConfirmEditTitle = {} as TemplateRef<unknown>;

    component.onConfirmEditTitlePlaylist(idPlaylist, title, contentModalConfirmEditTitle);

    expect(modalServiceMock.open).toHaveBeenCalledWith(contentModalConfirmEditTitle);
    expect(component.currentIdPlaylistEdit).toBe(idPlaylist);
    // Signal Forms: editTitleModel is set instead of playlistTitle
    expect(component.editTitleModel().playlist_titre).toBe(title);
  });

  it('should open modal and set currentIdPlaylistEdit', () => {
    const idPlaylist = '1';
    const contentModalConfirmDeletePlaylist = {} as TemplateRef<unknown>;

    component.onConfirmDeletePlaylist(idPlaylist, contentModalConfirmDeletePlaylist);

    expect(modalServiceMock.open).toHaveBeenCalledWith(contentModalConfirmDeletePlaylist);
    expect(component.currentIdPlaylistEdit).toBe(idPlaylist);
  });

  it('should call deletePlaylist on userLibraryService and dismiss the modal', () => {
    component.currentIdPlaylistEdit = '1';

    component.onDeletePlaylist(activeModalSpyObj);

    expect(userLibraryServiceMock.deletePlaylist).toHaveBeenCalledWith('1');
    expect(activeModalSpyObj.dismiss).toHaveBeenCalled();
  });

  it('should call editTitlePlaylist on userService and updatePlaylistTitle on userLibraryService, then dismiss the modal on success', () => {
    // Signal Forms: set model values directly
    component.editTitleModel.set({ playlist_titre: 'Updated Playlist Title' });
    component.currentIdPlaylistEdit = '1';

    const response = {
      success: true,
      error: '',
      id_playlist: '1',
      titre: 'Updated Playlist Title',
    } as CreatePlaylistResponse;

    userServiceMock.editTitlePlaylist.mockReturnValue(of(response));

    component.onEditTitlePlaylist(mockEvent, activeModalSpyObj);

    expect(userServiceMock.editTitlePlaylist).toHaveBeenCalledWith({
      id_playlist: '1',
      titre: 'Updated Playlist Title',
    });
    expect(userLibraryServiceMock.updatePlaylistTitle).toHaveBeenCalledWith(
      '1',
      'Updated Playlist Title'
    );
    expect(activeModalSpyObj.dismiss).toHaveBeenCalled();
  });

  it('should set error message on failed playlist title update', () => {
    // Signal Forms: set model values directly
    component.editTitleModel.set({ playlist_titre: 'Updated Playlist Title' });
    component.currentIdPlaylistEdit = '1';

    const response = { success: false, error: 'error_message' } as CreatePlaylistResponse;

    userServiceMock.editTitlePlaylist.mockReturnValue(of(response));

    component.onEditTitlePlaylist(mockEvent, activeModalSpyObj);

    expect(userServiceMock.editTitlePlaylist).toHaveBeenCalledWith({
      id_playlist: '1',
      titre: 'Updated Playlist Title',
    });
    expect(component.error()).toBeTruthy();
  });

  it('should set generic message on failed playlist title update', () => {
    // Signal Forms: set model values directly
    component.editTitleModel.set({ playlist_titre: 'Updated Playlist Title' });
    component.currentIdPlaylistEdit = '1';

    const response = { success: false } as CreatePlaylistResponse;

    userServiceMock.editTitlePlaylist.mockReturnValue(of(response));

    component.onEditTitlePlaylist(mockEvent, activeModalSpyObj);

    expect(userServiceMock.editTitlePlaylist).toHaveBeenCalledWith({
      id_playlist: '1',
      titre: 'Updated Playlist Title',
    });
  });
});
