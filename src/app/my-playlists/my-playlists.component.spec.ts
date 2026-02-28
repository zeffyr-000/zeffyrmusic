import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyPlaylistsComponent } from './my-playlists.component';
import { UserLibraryService } from '../services/user-library.service';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { submit } from '@angular/forms/signals';
import { CreatePlaylistResponse } from '../models/user.model';
import { UserDataStore } from '../store/user-data/user-data.store';
import { UiStore } from '../store/ui/ui.store';
import type { MockNgbModal, MockNgbActiveModal } from '../models/test-mocks.model';

describe('MyPlaylistsComponent', () => {
  let component: MyPlaylistsComponent;
  let fixture: ComponentFixture<MyPlaylistsComponent>;
  let translocoService: TranslocoService;
  let userServiceMock: {
    createPlaylist: ReturnType<typeof vi.fn>;
    editTitlePlaylist: ReturnType<typeof vi.fn>;
  };
  let userLibraryServiceMock: {
    addPlaylist: ReturnType<typeof vi.fn>;
    togglePlaylistVisibility: ReturnType<typeof vi.fn>;
    deletePlaylist: ReturnType<typeof vi.fn>;
    updatePlaylistTitle: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: MockNgbModal;
  let activeModalMock: MockNgbActiveModal;
  let userDataStore: InstanceType<typeof UserDataStore>;
  let uiStore: InstanceType<typeof UiStore>;

  beforeEach(async () => {
    userLibraryServiceMock = {
      addPlaylist: vi.fn(),
      togglePlaylistVisibility: vi.fn().mockReturnValue(of(true)),
      deletePlaylist: vi.fn().mockReturnValue(of(true)),
      updatePlaylistTitle: vi.fn(),
    };
    userServiceMock = {
      createPlaylist: vi.fn(),
      editTitlePlaylist: vi.fn(),
    };
    modalServiceMock = { open: vi.fn(), dismissAll: vi.fn() };
    activeModalMock = { close: vi.fn(), dismiss: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MyPlaylistsComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: UserService, useValue: userServiceMock },
        { provide: UserLibraryService, useValue: userLibraryServiceMock },
        { provide: NgbModal, useValue: modalServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
    userDataStore = TestBed.inject(UserDataStore);
    userDataStore.reset();
    uiStore = TestBed.inject(UiStore);
    vi.spyOn(uiStore, 'showSuccess').mockReturnValue('mock-id');
    vi.spyOn(uiStore, 'showError').mockReturnValue('mock-id');
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

  // --- Create playlist ---

  it('should call createPlaylist and addPlaylist on valid form submission', async () => {
    component.createPlaylistModel.set({ titre: 'New Playlist' });
    const response: CreatePlaylistResponse = {
      success: true,
      id_playlist: '1',
      titre: 'New Playlist',
      error: '',
    };
    userServiceMock.createPlaylist.mockReturnValue(of(response));

    await submit(component.createPlaylistForm);

    expect(userServiceMock.createPlaylist).toHaveBeenCalledWith({ titre: 'New Playlist' });
    expect(userLibraryServiceMock.addPlaylist).toHaveBeenCalledWith('1', 'New Playlist');
  });

  it('should show success toast on successful playlist creation', async () => {
    component.createPlaylistModel.set({ titre: 'New Playlist' });
    const response: CreatePlaylistResponse = {
      success: true,
      id_playlist: '1',
      titre: 'New Playlist',
      error: '',
    };
    userServiceMock.createPlaylist.mockReturnValue(of(response));
    const showSuccessSpy = vi.spyOn(uiStore, 'showSuccess');

    await submit(component.createPlaylistForm);

    expect(showSuccessSpy).toHaveBeenCalled();
  });

  it('should show error toast on failed playlist creation', async () => {
    component.createPlaylistModel.set({ titre: 'New Playlist' });
    const response = { success: false, error: 'error_message' } as CreatePlaylistResponse;
    userServiceMock.createPlaylist.mockReturnValue(of(response));
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    await submit(component.createPlaylistForm);

    expect(showErrorSpy).toHaveBeenCalled();
  });

  it('should show generic error toast on failed playlist creation without error key', async () => {
    component.createPlaylistModel.set({ titre: 'New Playlist' });
    const response = { success: false } as CreatePlaylistResponse;
    userServiceMock.createPlaylist.mockReturnValue(of(response));
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    await submit(component.createPlaylistForm);

    expect(showErrorSpy).toHaveBeenCalled();
  });

  it('should not call createPlaylist when form is invalid', async () => {
    component.createPlaylistModel.set({ titre: '' });

    await submit(component.createPlaylistForm);

    expect(userServiceMock.createPlaylist).not.toHaveBeenCalled();
  });

  it('should show error toast on HTTP error during creation', async () => {
    component.createPlaylistModel.set({ titre: 'New Playlist' });
    userServiceMock.createPlaylist.mockReturnValue(throwError(() => new Error('Network error')));
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    await submit(component.createPlaylistForm);

    expect(showErrorSpy).toHaveBeenCalled();
  });

  // --- Visibility ---

  it('should call togglePlaylistVisibility with correct parameters for prive', () => {
    component.onSwitchVisibility('1', 'prive');
    expect(userLibraryServiceMock.togglePlaylistVisibility).toHaveBeenCalledWith('1', true);
  });

  it('should call togglePlaylistVisibility with correct parameters for public', () => {
    component.onSwitchVisibility('1', 'public');
    expect(userLibraryServiceMock.togglePlaylistVisibility).toHaveBeenCalledWith('1', false);
  });

  it('should show error toast on toggle visibility HTTP error', () => {
    userLibraryServiceMock.togglePlaylistVisibility.mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    component.onSwitchVisibility('1', 'prive');

    expect(showErrorSpy).toHaveBeenCalled();
  });

  // --- Edit title ---

  it('should open modal and set currentIdPlaylistEdit and editTitleModel', () => {
    const contentModal = {} as TemplateRef<unknown>;

    component.onConfirmEditTitlePlaylist('1', 'My Playlist', contentModal);

    expect(modalServiceMock.open).toHaveBeenCalledWith(contentModal, { size: 'lg' });
    expect(component.currentIdPlaylistEdit()).toBe('1');
    expect(component.editTitleModel().playlist_titre).toBe('My Playlist');
  });

  it('should call editTitlePlaylist and dismiss modal on success', async () => {
    component.editTitleModel.set({ playlist_titre: 'Updated Title' });
    component.currentIdPlaylistEdit.set('1');
    const response = { success: true, error: '' } as CreatePlaylistResponse;
    userServiceMock.editTitlePlaylist.mockReturnValue(of(response));

    await submit(component.editTitleForm);

    expect(userServiceMock.editTitlePlaylist).toHaveBeenCalledWith({
      id_playlist: '1',
      titre: 'Updated Title',
    });
    expect(userLibraryServiceMock.updatePlaylistTitle).toHaveBeenCalledWith('1', 'Updated Title');
    expect(modalServiceMock.dismissAll).toHaveBeenCalled();
  });

  it('should show error toast on failed title update', async () => {
    component.editTitleModel.set({ playlist_titre: 'Updated Title' });
    component.currentIdPlaylistEdit.set('1');
    const response = { success: false, error: 'error_message' } as CreatePlaylistResponse;
    userServiceMock.editTitlePlaylist.mockReturnValue(of(response));
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    await submit(component.editTitleForm);

    expect(showErrorSpy).toHaveBeenCalled();
  });

  it('should not call editTitlePlaylist when form is invalid', async () => {
    component.editTitleModel.set({ playlist_titre: '' });
    component.currentIdPlaylistEdit.set('1');

    await submit(component.editTitleForm);

    expect(userServiceMock.editTitlePlaylist).not.toHaveBeenCalled();
  });

  it('should show error toast on HTTP error during title edit', async () => {
    component.editTitleModel.set({ playlist_titre: 'Updated Title' });
    component.currentIdPlaylistEdit.set('1');
    userServiceMock.editTitlePlaylist.mockReturnValue(throwError(() => new Error('Network error')));
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    await submit(component.editTitleForm);

    expect(showErrorSpy).toHaveBeenCalled();
  });

  // --- Delete playlist ---

  it('should open delete modal and set currentIdPlaylistEdit', () => {
    const contentModal = {} as TemplateRef<unknown>;

    component.onConfirmDeletePlaylist('1', contentModal);

    expect(modalServiceMock.open).toHaveBeenCalledWith(contentModal, { size: 'lg' });
    expect(component.currentIdPlaylistEdit()).toBe('1');
  });

  it('should call deletePlaylist and dismiss modal on success', () => {
    component.currentIdPlaylistEdit.set('1');

    component.onDeletePlaylist(activeModalMock as unknown as NgbActiveModal);

    expect(userLibraryServiceMock.deletePlaylist).toHaveBeenCalledWith('1');
    expect(activeModalMock.dismiss).toHaveBeenCalled();
  });

  it('should show error toast on HTTP error during delete', () => {
    component.currentIdPlaylistEdit.set('1');
    userLibraryServiceMock.deletePlaylist.mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    const showErrorSpy = vi.spyOn(uiStore, 'showError');

    component.onDeletePlaylist(activeModalMock as unknown as NgbActiveModal);

    expect(showErrorSpy).toHaveBeenCalled();
  });
});
