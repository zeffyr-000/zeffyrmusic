import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MySelectionComponent } from './my-selection.component';
import { UserLibraryService } from '../services/user-library.service';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { AuthGuard } from '../services/auth-guard.service';
import { NO_ERRORS_SCHEMA, TemplateRef } from '@angular/core';
import { UserDataStore } from '../store/user-data/user-data.store';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UiStore } from '../store/ui/ui.store';
import type { MockNgbActiveModal, MockNgbModal } from '../models/test-mocks.model';

describe('MySelectionComponent', () => {
  let component: MySelectionComponent;
  let fixture: ComponentFixture<MySelectionComponent>;
  let userLibraryServiceMock: {
    removeFollow: ReturnType<typeof vi.fn>;
  };
  let translocoService: TranslocoService;
  let userDataStore: InstanceType<typeof UserDataStore>;
  let modalServiceMock: MockNgbModal;
  let uiStore: InstanceType<typeof UiStore>;

  beforeEach(async () => {
    userLibraryServiceMock = {
      removeFollow: vi.fn().mockReturnValue(of({ success: true, isFollowing: false })),
    };

    const authGuardMock = { canActivate: vi.fn() };
    modalServiceMock = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MySelectionComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: UserLibraryService, useValue: userLibraryServiceMock },
        { provide: AuthGuard, useValue: authGuardMock },
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
    fixture = TestBed.createComponent(MySelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the title on init', () => {
    component.ngOnInit();
    expect(component['titleService'].getTitle()).toBe('My lightbox - Zeffyr Music');
  });

  it('should get follows from userDataStore', () => {
    const followItems = [
      { id_playlist: '1', titre: 'Test Follow Item', artiste: '', url_image: '', id_top: '' },
    ];
    userDataStore.setFollows(followItems);
    expect(component.userDataStore.follows()).toEqual(followItems);
  });

  it('should call removeFollow on userLibraryService when onDeleteFollow is called', () => {
    const idPlaylist = '1';
    const activeModalMock: MockNgbActiveModal = { close: vi.fn(), dismiss: vi.fn() };
    component['pendingDeleteId'].set(idPlaylist);
    component.onDeleteFollow(activeModalMock as unknown as NgbActiveModal);
    expect(userLibraryServiceMock.removeFollow).toHaveBeenCalledWith(idPlaylist);
    expect(activeModalMock.dismiss).toHaveBeenCalled();
  });

  it('should set pending signals and open modal on onConfirmDeleteFollow', () => {
    const templateRef = {} as TemplateRef<unknown>;
    component.onConfirmDeleteFollow('42', 'My Title', 'My Artist', templateRef);
    expect(component['pendingDeleteId']()).toBe('42');
    expect(component.pendingDeleteTitle()).toBe('My Title');
    expect(component.pendingDeleteArtist()).toBe('My Artist');
    expect(modalServiceMock.open).toHaveBeenCalledWith(templateRef, { size: 'lg' });
  });

  it('should show error toast when removeFollow fails', () => {
    userLibraryServiceMock.removeFollow.mockReturnValue(throwError(() => new Error('fail')));
    const activeModalMock: MockNgbActiveModal = { close: vi.fn(), dismiss: vi.fn() };
    vi.spyOn(uiStore, 'showError');
    component['pendingDeleteId'].set('1');
    component.onDeleteFollow(activeModalMock as unknown as NgbActiveModal);
    expect(uiStore.showError).toHaveBeenCalled();
    expect(activeModalMock.dismiss).not.toHaveBeenCalled();
  });

  it('should translate title correctly on init', () => {
    vi.spyOn(translocoService, 'translate').mockReturnValue('Ma sélection');
    component.ngOnInit();
    expect(component['titleService'].getTitle()).toBe('Ma sélection - Zeffyr Music');
  });

  it('should handle empty follow list', () => {
    userDataStore.reset();
    expect(component.userDataStore.follows()).toEqual([]);
  });

  it('should handle multiple follow items', () => {
    const followItems = [
      { id_playlist: '1', titre: 'Test Follow Item 1', artiste: '', url_image: '', id_top: '' },
      { id_playlist: '2', titre: 'Test Follow Item 2', artiste: '', url_image: '', id_top: '' },
    ];
    userDataStore.setFollows(followItems);
    expect(component.userDataStore.follows()).toEqual(followItems);
  });
});
