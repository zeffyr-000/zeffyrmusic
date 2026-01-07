import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgZone, NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CurrentComponent } from './current.component';
import { PlayerService } from '../services/player.service';
import { InitService } from '../services/init.service';
import { Video } from '../models/video.model';
import { getTranslocoTestingProviders } from '../transloco-testing';

describe('CurrentComponent', () => {
  let component: CurrentComponent;
  let fixture: ComponentFixture<CurrentComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let playerServiceMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initServiceMock: any;
  let ngZoneMock: NgZone;

  const mockPlaylist: Video[] = [
    { key: 'key1', titre: 'Video 1', artiste: 'Artist 1' } as Video,
    { key: 'key2', titre: 'Video 2', artiste: 'Artist 2' } as Video,
  ];
  const mockCurrentKey = { currentKey: 'key1', currentTitle: 'Video 1', currentArtist: 'Artist 1' };
  const mockConnectedState = {
    isConnected: true,
    pseudo: 'test',
    idPerso: '1',
    mail: 'test@test.com',
  };

  let currentPlaylistSubject: BehaviorSubject<Video[]>;
  let currentKeySubject: BehaviorSubject<{
    currentKey: string;
    currentTitle: string;
    currentArtist: string;
  }>;
  let connectedSubject: BehaviorSubject<{
    isConnected: boolean;
    pseudo: string;
    idPerso: string;
    mail: string;
  }>;

  beforeEach(async () => {
    currentPlaylistSubject = new BehaviorSubject<Video[]>(mockPlaylist);
    currentKeySubject = new BehaviorSubject<{
      currentKey: string;
      currentTitle: string;
      currentArtist: string;
    }>(mockCurrentKey);
    connectedSubject = new BehaviorSubject<{
      isConnected: boolean;
      pseudo: string;
      idPerso: string;
      mail: string;
    }>(mockConnectedState);

    playerServiceMock = {
      lecture: vi.fn(),
      removeToPlaylist: vi.fn(),
      subjectCurrentPlaylistChange: currentPlaylistSubject,
      subjectCurrentKeyChange: currentKeySubject,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    initServiceMock = {
      subjectConnectedChange: connectedSubject,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    ngZoneMock = new NgZone({ enableLongStackTrace: false });
    vi.spyOn(ngZoneMock, 'run').mockImplementation(<T>(fn: (...args: unknown[]) => T) => fn());

    await TestBed.configureTestingModule({
      imports: [CurrentComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: InitService, useValue: initServiceMock },
        { provide: NgZone, useValue: ngZoneMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrentComponent);
    component = fixture.componentInstance;

    component.list = [];
    component.currentKey = '';

    component.subscription = new Subscription();
    component.subscriptionChangeKey = new Subscription();
    component.subscriptionConnected = new Subscription();

    vi.spyOn(component.subscription, 'unsubscribe');
    vi.spyOn(component.subscriptionChangeKey, 'unsubscribe');
    vi.spyOn(component.subscriptionConnected, 'unsubscribe');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize list with current playlist from PlayerService', () => {
      component.ngOnInit();
      expect(component.list).toEqual(mockPlaylist);
    });

    it('should subscribe to PlayerService.subjectCurrentPlaylistChange', () => {
      const subscribeSpy = vi.spyOn(playerServiceMock.subjectCurrentPlaylistChange, 'subscribe');
      component.ngOnInit();
      expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should update list when PlayerService.subjectCurrentPlaylistChange emits new value', () => {
      component.ngOnInit();

      const newPlaylist = [{ key: 'key3', titre: 'Video 3', artiste: 'Artist 3' } as Video];
      currentPlaylistSubject.next(newPlaylist);

      expect(component.list).toEqual(newPlaylist);
    });

    it('should subscribe to PlayerService.subjectCurrentKeyChange', () => {
      const subscribeSpy = vi.spyOn(playerServiceMock.subjectCurrentKeyChange, 'subscribe');
      component.ngOnInit();
      expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should update currentKey and use NgZone.run when PlayerService.subjectCurrentKeyChange emits', () => {
      component.ngOnInit();

      const newCurrentKey = {
        currentKey: 'key3',
        currentTitle: 'Video 3',
        currentArtist: 'Artist 3',
      };
      currentKeySubject.next(newCurrentKey);

      expect(component.currentKey).toEqual(newCurrentKey.currentKey);
      expect(ngZoneMock.run).toHaveBeenCalled();
    });

    it('should subscribe to InitService.subjectConnectedChange', () => {
      const subscribeSpy = vi.spyOn(initServiceMock.subjectConnectedChange, 'subscribe');
      component.ngOnInit();
      expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should update isConnected when InitService.subjectConnectedChange emits new value', () => {
      component.ngOnInit();

      const newConnectedState = { isConnected: false, pseudo: '', idPerso: '', mail: '' };
      connectedSubject.next(newConnectedState);

      expect(component.isConnected).toEqual(newConnectedState.isConnected);
    });
  });

  describe('play', () => {
    it('should call PlayerService.lecture with correct parameters', () => {
      const index = 1;
      const isInitialIndex = true;

      component.play(index, isInitialIndex);

      expect(playerServiceMock.lecture).toHaveBeenCalledWith(index, isInitialIndex);
    });
  });

  describe('removeToPlaylist', () => {
    it('should call PlayerService.removeToPlaylist with correct index', () => {
      const index = 1;

      component.removeToPlaylist(index);

      expect(playerServiceMock.removeToPlaylist).toHaveBeenCalledWith(index);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      component.ngOnDestroy();

      expect(component.subscription.unsubscribe).toHaveBeenCalled();
      expect(component.subscriptionChangeKey.unsubscribe).toHaveBeenCalled();
      expect(component.subscriptionConnected.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Component integration', () => {
    beforeEach(() => {
      component.list = mockPlaylist;
      component.currentKey = 'key1';
      component.isConnected = true;
      fixture.detectChanges();
    });

    it('should be able to manage playlist state', () => {
      expect(component.list).toEqual(mockPlaylist);
      expect(component.currentKey).toBe('key1');
      expect(component.isConnected).toBe(true);
    });

    it('should handle playlist changes', () => {
      const emptyPlaylist: Video[] = [];
      component.list = emptyPlaylist;
      expect(component.list.length).toBe(0);

      component.list = mockPlaylist;
      expect(component.list.length).toBe(2);
    });

    it('should handle connection state changes', () => {
      component.isConnected = false;
      expect(component.isConnected).toBe(false);

      component.isConnected = true;
      expect(component.isConnected).toBe(true);
    });
  });
});
