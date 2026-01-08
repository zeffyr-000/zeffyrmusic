import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MySelectionComponent } from './my-selection.component';
import { PlayerService } from '../services/player.service';
import { TranslocoService } from '@jsverse/transloco';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { AuthGuard } from '../services/auth-guard.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserDataStore } from '../store/user-data/user-data.store';

describe('MySelectionComponent', () => {
  let component: MySelectionComponent;
  let fixture: ComponentFixture<MySelectionComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let playerServiceMock: any;
  let translocoService: TranslocoService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let playerService: PlayerService;
  let userDataStore: InstanceType<typeof UserDataStore>;

  beforeEach(async () => {
    playerServiceMock = { deleteFollow: vi.fn() };

    const authGuardMock = { canActivate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MySelectionComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: AuthGuard, useValue: authGuardMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    translocoService.setDefaultLang('en');
    playerService = TestBed.inject(PlayerService);
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

  it('should call deleteFollow on playerService when onDeleteFollow is called', () => {
    const idPlaylist = '1';
    component.onDeleteFollow(idPlaylist);
    expect(playerServiceMock.deleteFollow).toHaveBeenCalledWith(idPlaylist);
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
