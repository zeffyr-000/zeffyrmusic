import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MySelectionComponent } from './my-selection.component';
import { UserLibraryService } from '../services/user-library.service';
import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { AuthGuard } from '../services/auth-guard.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserDataStore } from '../store/user-data/user-data.store';

describe('MySelectionComponent', () => {
  let component: MySelectionComponent;
  let fixture: ComponentFixture<MySelectionComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userLibraryServiceMock: any;
  let translocoService: TranslocoService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userLibraryService: UserLibraryService;
  let userDataStore: InstanceType<typeof UserDataStore>;

  beforeEach(async () => {
    userLibraryServiceMock = {
      removeFollow: vi.fn().mockReturnValue(of({ success: true, isFollowing: false })),
    };

    const authGuardMock = { canActivate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MySelectionComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: UserLibraryService, useValue: userLibraryServiceMock },
        { provide: AuthGuard, useValue: authGuardMock },
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
    component.onDeleteFollow(idPlaylist);
    expect(userLibraryServiceMock.removeFollow).toHaveBeenCalledWith(idPlaylist);
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
