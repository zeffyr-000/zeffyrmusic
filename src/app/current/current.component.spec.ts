import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { CurrentComponent } from './current.component';
import { PlayerService } from '../services/player.service';
import { QueueStore, AuthStore } from '../store';
import { getTranslocoTestingProviders } from '../transloco-testing';

describe('CurrentComponent', () => {
  let component: CurrentComponent;
  let fixture: ComponentFixture<CurrentComponent>;
  let playerServiceMock: {
    lecture: ReturnType<typeof vi.fn>;
    removeToPlaylist: ReturnType<typeof vi.fn>;
  };
  let queueStore: InstanceType<typeof QueueStore>;
  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(async () => {
    playerServiceMock = {
      lecture: vi.fn(),
      removeToPlaylist: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CurrentComponent],
      providers: [
        getTranslocoTestingProviders(),
        { provide: PlayerService, useValue: playerServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    queueStore = TestBed.inject(QueueStore);
    authStore = TestBed.inject(AuthStore);

    queueStore.clear();
    authStore.logout();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Store integration', () => {
    it('should have access to queueStore', () => {
      expect(component.queueStore).toBeDefined();
    });

    it('should have access to authStore', () => {
      expect(component.authStore).toBeDefined();
    });

    it('should reflect queue items from store', () => {
      expect(component.queueStore.items()).toEqual([]);

      queueStore.setQueue(
        [
          {
            key: 'key1',
            titre: 'Video 1',
            artiste: 'Artist 1',
            duree: '3:00',
            id_video: '1',
            artists: [],
            id_playlist: '1',
            ordre: '1',
            titre_album: 'Album 1',
          },
          {
            key: 'key2',
            titre: 'Video 2',
            artiste: 'Artist 2',
            duree: '4:00',
            id_video: '2',
            artists: [],
            id_playlist: '1',
            ordre: '2',
            titre_album: 'Album 2',
          },
        ],
        null
      );

      expect(component.queueStore.items().length).toBe(2);
    });

    it('should reflect current key from store', () => {
      queueStore.setQueue(
        [
          {
            key: 'key1',
            titre: 'Video 1',
            artiste: 'Artist 1',
            duree: '3:00',
            id_video: '1',
            artists: [],
            id_playlist: '1',
            ordre: '1',
            titre_album: 'Album 1',
          },
        ],
        null
      );

      expect(component.queueStore.currentKey()).toBe('key1');
    });

    it('should reflect authentication state from store', () => {
      expect(component.authStore.isAuthenticated()).toBe(false);

      authStore.login(
        {
          pseudo: 'test',
          mail: 'test@test.com',
          idPerso: '123',
        },
        { darkModeEnabled: false, language: 'fr' }
      );

      expect(component.authStore.isAuthenticated()).toBe(true);
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
});
