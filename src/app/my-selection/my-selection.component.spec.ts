import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MySelectionComponent } from './my-selection.component';
import { PlayerService } from '../services/player.service';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Subscription } from 'rxjs';
import { getTranslocoModule } from '../transloco-testing.module';
import { InitService } from '../services/init.service';
import { AuthGuard } from '../services/auth-guard.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FollowItem } from '../models/follow.model';

describe('MySelectionComponent', () => {
  let component: MySelectionComponent;
  let fixture: ComponentFixture<MySelectionComponent>;
  let playerServiceMock: PlayerService;
  let translocoService: TranslocoService;
  let initServiceMock: jasmine.SpyObj<InitService>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let initService: InitService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let playerService: PlayerService;

  beforeEach(async () => {
    playerServiceMock = jasmine.createSpyObj('PlayerService', ['deleteFollow']);
    initServiceMock = jasmine.createSpyObj('InitService', ['loginSuccess', 'logOut', 'onMessageUnlog']);

    const authGuardMock = jasmine.createSpyObj('AuthGuard', ['canActivate']);
    playerServiceMock.subjectListFollow = new BehaviorSubject([]);

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
    imports: [getTranslocoModule(), MySelectionComponent],
    providers: [
        { provide: InitService, useValue: initServiceMock },
        { provide: PlayerService, useValue: playerServiceMock },
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

  it('should subscribe to playerService.subjectListFollow on init', () => {
    const followItems = [{ id_playlist: '1', titre: 'Test Follow Item' }];
    playerServiceMock.subjectListFollow.next(followItems);
    component.ngOnInit();
    expect(component.listFollow).toEqual(followItems);
  });

  it('should call deleteFollow on playerService when onDeleteFollow is called', () => {
    const idPlaylist = '1';
    component.onDeleteFollow(idPlaylist);
    expect(playerServiceMock.deleteFollow).toHaveBeenCalledWith(idPlaylist);
  });

  it('should unsubscribe from playerService.subjectListFollow on destroy', () => {
    component.subscriptionListFollow = new Subscription();
    spyOn(component.subscriptionListFollow, 'unsubscribe');
    component.ngOnDestroy();
    expect(component.subscriptionListFollow.unsubscribe).toHaveBeenCalled();
  });

  it('should translate title correctly on init', () => {
    spyOn(translocoService, 'translate').and.returnValue('Ma sélection');
    component.ngOnInit();
    expect(component['titleService'].getTitle()).toBe('Ma sélection - Zeffyr Music');
  });

  it('should handle empty follow list on init', () => {
    const followItems: FollowItem[] = [];
    playerServiceMock.subjectListFollow.next(followItems);
    component.ngOnInit();
    expect(component.listFollow).toEqual(followItems);
  });

  it('should handle multiple follow items on init', () => {
    const followItems = [
      { id_playlist: '1', titre: 'Test Follow Item 1' },
      { id_playlist: '2', titre: 'Test Follow Item 2' }
    ];
    playerServiceMock.subjectListFollow.next(followItems);
    component.ngOnInit();
    expect(component.listFollow).toEqual(followItems);
  });

});