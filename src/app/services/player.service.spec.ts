import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { InitService } from './init.service';
import { PlayerService } from './player.service';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, Subject } from 'rxjs';
import { Video } from '../models/video.model';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { PLATFORM_ID } from '@angular/core';
import { YoutubePlayerService } from './youtube-player.service';
import { UserLibraryService } from './user-library.service';
import { PlayerStore } from '../store/player/player.store';
import { QueueStore } from '../store/queue/queue.store';
import { UiStore } from '../store/ui/ui.store';

const createMockYoutubePlayerService = () => ({
  playerReady$: new BehaviorSubject<boolean>(true),
  stateChange$: new Subject<number>(),
  error$: new BehaviorSubject<string | null>(null),
  initPlayer: vi.fn(),
  cueVideo: vi.fn(),
  loadVideo: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  togglePlayPause: vi.fn().mockReturnValue(true),
  setVolume: vi.fn(),
  mute: vi.fn(),
  unMute: vi.fn(),
  seekTo: vi.fn(),
  seekToPercent: vi.fn(),
  getPlayerState: vi.fn().mockReturnValue(2),
  getCurrentTime: vi.fn().mockReturnValue(50),
  getDuration: vi.fn().mockReturnValue(100),
  getLoadedFraction: vi.fn().mockReturnValue(0.5),
  clearError: vi.fn(),
  destroy: vi.fn(),
});

const mockVideo = (overrides: Partial<Video> & { key: string }): Video =>
  ({
    id_video: overrides.id_video ?? overrides.key,
    artiste: overrides.artiste ?? '',
    artists: overrides.artists ?? [],
    duree: overrides.duree ?? '100',
    id_playlist: overrides.id_playlist ?? 'p1',
    key: overrides.key,
    ordre: overrides.ordre ?? '1',
    titre: overrides.titre ?? overrides.key,
    titre_album: overrides.titre_album ?? '',
  }) as Video;

describe('PlayerService', () => {
  describe('Browser context', () => {
    let service: PlayerService;
    let titleService: Title;
    let translocoService: TranslocoService;
    let mockYoutubePlayer: ReturnType<typeof createMockYoutubePlayerService>;
    let playerStore: InstanceType<typeof PlayerStore>;
    let queueStore: InstanceType<typeof QueueStore>;

    beforeEach(async () => {
      mockYoutubePlayer = createMockYoutubePlayerService();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initServiceMock: any = { init: vi.fn(), onMessageUnlog: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [],
        providers: [
          getTranslocoTestingProviders(),
          {
            provide: Title,
            useValue: {
              setTitle: () => {
                // Mock setTitle
              },
            },
          },
          {
            provide: InitService,
            useValue: initServiceMock,
          },
          {
            provide: PLATFORM_ID,
            useValue: 'browser',
          },
          {
            provide: YoutubePlayerService,
            useValue: mockYoutubePlayer,
          },
          {
            provide: UserLibraryService,
            useValue: {},
          },
          PlayerService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
      }).compileComponents();
      service = TestBed.inject(PlayerService);
      titleService = TestBed.inject(Title);
      translocoService = TestBed.inject(TranslocoService);
      translocoService.setDefaultLang('en');
      playerStore = TestBed.inject(PlayerStore);
      queueStore = TestBed.inject(QueueStore);
    });

    /** Helper: set up a queue in the store and return the videos */
    function setupQueue(videos: Video[]): void {
      queueStore.setQueue(videos, 'p1', null);
    }

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize YoutubePlayerService on construction', () => {
      expect(mockYoutubePlayer.initPlayer).toHaveBeenCalledWith('player');
    });

    it('should cue video from store via effect on first queue initialization', () => {
      const videos = [mockVideo({ key: 'key1', titre: 'title1', artiste: 'artist1' })];
      queueStore.setQueue(videos, null, null);

      TestBed.flushEffects();

      expect(queueStore.currentKey()).toBe('key1');
      expect(queueStore.currentTitle()).toBe('title1');
      expect(queueStore.currentArtist()).toBe('artist1');
    });

    it('should update PlayerStore when stateChange$ emits', () => {
      mockYoutubePlayer.stateChange$.next(1); // PLAYING
      expect(playerStore.isPlaying()).toBe(true);

      mockYoutubePlayer.stateChange$.next(2); // PAUSED
      expect(playerStore.isPaused()).toBe(true);
    });

    it('should call after() when video ends (state 0)', () => {
      const afterSpy = vi.spyOn(service, 'after');
      mockYoutubePlayer.stateChange$.next(0); // ENDED
      expect(afterSpy).toHaveBeenCalled();
    });

    it('should set the page title on lecture', () => {
      vi.spyOn(titleService, 'setTitle');
      const videos = [
        mockVideo({
          key: 'testId',
          titre: 'Test Video',
          artiste: 'Test Artist',
          artists: [{ id_artist: '123', label: 'Test Artist' }],
        }),
      ];
      setupQueue(videos);

      service.lecture(0);

      expect(titleService.setTitle).toHaveBeenCalledWith('Test Video - Test Artist - Zeffyr Music');
      expect(mockYoutubePlayer.loadVideo).toHaveBeenCalledWith('testId');
    });

    it('should update store currentKey, currentTitle, and currentArtist on lecture', () => {
      const videos = [
        mockVideo({
          key: 'XXX-123',
          titre: 'Test Video',
          artiste: 'Test Artist',
          artists: [{ id_artist: '123', label: 'Test Artist' }],
        }),
      ];
      setupQueue(videos);

      service.lecture(0);

      expect(queueStore.currentKey()).toBe('XXX-123');
      expect(queueStore.currentTitle()).toBe('Test Video');
      expect(queueStore.currentArtist()).toBe('Test Artist');
    });

    it('should update the volume and emit the new value on updateVolume', () => {
      service.updateVolume(50);
      expect(mockYoutubePlayer.setVolume).toHaveBeenCalledWith(50);
      expect(mockYoutubePlayer.unMute).toHaveBeenCalled();
      expect(playerStore.volume()).toBe(50);
    });

    it('should mute the player when volume is updated to 0', () => {
      service.updateVolume(0);
      expect(mockYoutubePlayer.setVolume).toHaveBeenCalledWith(0);
      expect(mockYoutubePlayer.mute).toHaveBeenCalled();
      expect(playerStore.volume()).toBe(0);
    });

    it('should toggle mute and call youtubePlayer.mute when muted', () => {
      playerStore.setVolume(50);
      service.toggleMute();
      expect(playerStore.isMuted()).toBe(true);
      expect(mockYoutubePlayer.mute).toHaveBeenCalled();
    });

    it('should toggle mute and call youtubePlayer.unMute and setVolume when unmuted', () => {
      playerStore.setVolume(50);
      service.toggleMute(); // Mute it first
      expect(playerStore.isMuted()).toBe(true);

      service.toggleMute(); // Unmute it
      expect(playerStore.isMuted()).toBe(false);
      expect(mockYoutubePlayer.unMute).toHaveBeenCalled();
      expect(mockYoutubePlayer.setVolume).toHaveBeenCalledWith(50);
    });

    it('should update the player position on updatePositionSlider', () => {
      service.updatePositionSlider(0.5);
      expect(mockYoutubePlayer.seekToPercent).toHaveBeenCalledWith(50);
    });

    it('should remove a video from the queue on removeToPlaylist', () => {
      const videos = [
        mockVideo({ key: 'XXX', id_video: '123', titre: 'Test Video', artiste: 'Test Artist' }),
        mockVideo({
          key: 'YYY',
          id_video: '456',
          titre: 'Test Video 2',
          artiste: 'Test Artist 2',
        }),
      ];
      setupQueue(videos);
      queueStore.goToIndex(1);

      service.removeToPlaylist(0);

      expect(queueStore.items()).toHaveLength(1);
      expect(queueStore.items()[0].key).toBe('YYY');
      expect(queueStore.tabIndex()).toEqual([0]);
      expect(queueStore.currentIndex()).toBe(0);
    });

    it('should decrease currentIndex on removeToPlaylist when removing before current', () => {
      const videos = [
        mockVideo({ key: 'k1', id_video: '1' }),
        mockVideo({ key: 'k2', id_video: '2' }),
        mockVideo({ key: 'k3', id_video: '3' }),
      ];
      setupQueue(videos);
      queueStore.goToIndex(2);

      service.removeToPlaylist(0);

      expect(queueStore.items()).toHaveLength(2);
      expect(mockYoutubePlayer.pause).not.toHaveBeenCalled();
      expect(queueStore.currentIndex()).toBe(1);
    });

    it('should pause player on removeToPlaylist when removing current track', () => {
      const videos = [
        mockVideo({ key: 'k1', id_video: '1' }),
        mockVideo({ key: 'k2', id_video: '2' }),
      ];
      setupQueue(videos);

      // currentIndex=0 → tabIndex[0]=0 → removing item 0 = current track
      service.removeToPlaylist(0);

      expect(mockYoutubePlayer.pause).toHaveBeenCalled();
    });

    it('should call queueStore.removeFromQueue on removeToPlaylist', () => {
      const videos = [
        mockVideo({ key: 'k1', id_video: '1' }),
        mockVideo({ key: 'k2', id_video: '2' }),
      ];
      setupQueue(videos);

      const spy = vi.spyOn(queueStore, 'removeFromQueue');
      service.removeToPlaylist(1);

      expect(spy).toHaveBeenCalledWith(1);
    });

    it('should toggle repeat via playerStore on switchRepeat', () => {
      const spy = vi.spyOn(playerStore, 'toggleRepeat');
      service.switchRepeat();
      expect(spy).toHaveBeenCalled();
    });

    it('should toggle shuffle via queueStore on switchRandom', () => {
      const videos = [
        mockVideo({ key: 'k1', id_video: '1' }),
        mockVideo({ key: 'k2', id_video: '2' }),
        mockVideo({ key: 'k3', id_video: '3' }),
      ];
      setupQueue(videos);

      const spy = vi.spyOn(queueStore, 'toggleShuffle');
      service.switchRandom();

      expect(spy).toHaveBeenCalled();
      expect(queueStore.isShuffled()).toBe(true);
    });

    it('should restore original tabIndex when shuffle is disabled via switchRandom', () => {
      const videos = [
        mockVideo({ key: 'k1', id_video: '1' }),
        mockVideo({ key: 'k2', id_video: '2' }),
        mockVideo({ key: 'k3', id_video: '3' }),
      ];
      setupQueue(videos);

      // Enable then disable shuffle
      service.switchRandom();
      service.switchRandom();

      expect(queueStore.isShuffled()).toBe(false);
      expect(queueStore.tabIndex()).toEqual([0, 1, 2]);
    });

    it('should remove video from queue by id_video on removeVideoFromQueue', () => {
      const videos = [
        mockVideo({ key: 'XXX', id_video: '1', titre: 'Test Video', artiste: 'Test Artist' }),
        mockVideo({ key: 'YYY', id_video: '2', titre: 'Test Video 2', artiste: 'Test Artist 2' }),
        mockVideo({ key: 'ZZZ', id_video: '3', titre: 'Test Video 3', artiste: 'Test Artist 3' }),
      ];
      setupQueue(videos);

      service.removeVideoFromQueue('2');

      expect(queueStore.items().length).toBe(2);
      expect(queueStore.items().find(v => v.id_video === '2')).toBeUndefined();
    });

    it('should do nothing if video not found on removeVideoFromQueue', () => {
      const videos = [
        mockVideo({ key: 'XXX', id_video: '1', titre: 'Test Video', artiste: 'Test Artist' }),
      ];
      setupQueue(videos);

      service.removeVideoFromQueue('999');

      expect(queueStore.items().length).toBe(1);
    });

    it('should set empty artist when not provided on lecture', () => {
      const videos = [
        mockVideo({
          key: 'ZZZ-789',
          id_video: '789',
          titre: 'Test Video 3',
          artiste: '',
        }),
      ];
      setupQueue(videos);

      service.lecture(0);

      expect(queueStore.currentKey()).toBe('ZZZ-789');
      expect(queueStore.currentTitle()).toBe('Test Video 3');
      expect(queueStore.currentArtist()).toBe('');
    });

    it('should update the current index on lecture', () => {
      const videos = [
        mockVideo({ key: 'XXX-123', titre: 'Test Video', artiste: 'Test Artist' }),
        mockVideo({ key: 'YYY-456', titre: 'Test Video 2', artiste: 'Test Artist 2' }),
        mockVideo({ key: 'ZZZ-789', titre: 'Test Video 3', artiste: '' }),
      ];
      setupQueue(videos);

      service.lecture(1);
      expect(queueStore.currentIndex()).toBe(1);

      service.lecture(2, true);
      expect(queueStore.currentIndex()).toBe(2);
      expect(queueStore.currentArtist()).toBe('');
    });

    it('should update PlayerStore to paused state via stateChange$', () => {
      mockYoutubePlayer.stateChange$.next(2); // PAUSED
      expect(playerStore.isPaused()).toBe(true);
    });

    it('should update PlayerStore to playing state via stateChange$', () => {
      mockYoutubePlayer.stateChange$.next(1); // PLAYING
      expect(playerStore.isPlaying()).toBe(true);
    });

    it('should update PlayerStore to ended state via stateChange$', () => {
      mockYoutubePlayer.stateChange$.next(0); // ENDED
      expect(playerStore.status()).toBe('ended');
    });

    it('should update PlayerStore to idle state via stateChange$', () => {
      mockYoutubePlayer.stateChange$.next(-1); // UNSTARTED
      expect(playerStore.status()).toBe('idle');
    });

    it('should call lecture on before', () => {
      const spy = vi.spyOn(service, 'lecture');
      const videos = [
        mockVideo({ key: 'key1', titre: 'title1', artiste: 'artist1' }),
        mockVideo({ key: 'key2', titre: 'title2', artiste: 'artist2' }),
        mockVideo({ key: 'key3', titre: 'title3', artiste: 'artist3' }),
      ];
      setupQueue(videos);
      queueStore.goToIndex(1);

      service.before();
      expect(spy).toHaveBeenCalledWith(0);
    });

    it('should call lecture on after', () => {
      const spy = vi.spyOn(service, 'lecture');
      const videos = [
        mockVideo({ key: 'key1', titre: 'title1', artiste: 'artist1' }),
        mockVideo({ key: 'key2', titre: 'title2', artiste: 'artist2' }),
        mockVideo({ key: 'key3', titre: 'title3', artiste: 'artist3' }),
      ];
      setupQueue(videos);
      queueStore.goToIndex(1);

      service.after();
      expect(spy).toHaveBeenCalledWith(2);
    });

    it('should call lecture with 0 on after when isRepeat is true and at end of queue', () => {
      vi.spyOn(playerStore, 'isRepeat').mockReturnValue(true);
      const videos = [mockVideo({ key: 'key1', titre: 'title1', artiste: 'artist1' })];
      setupQueue(videos);

      const spyLecture = vi.spyOn(service, 'lecture');

      service.after();

      expect(spyLecture).toHaveBeenCalledWith(0);
    });

    it('should call lecture with indexInitial flag', () => {
      const spy = vi.spyOn(service, 'lecture');
      const videos = [mockVideo({ key: 'XXX', titre: 'Test Video', artiste: 'Test Artist' })];
      setupQueue(videos);

      service.lecture(0, true);
      expect(spy).toHaveBeenCalledWith(0, true);
      expect(queueStore.currentIndex()).toBe(0);
    });

    it('should toggle play/pause via YoutubePlayerService on onPlayPause', () => {
      service.onPlayPause();
      expect(mockYoutubePlayer.togglePlayPause).toHaveBeenCalled();
    });

    it('should call youtubePlayer.destroy on ngOnDestroy', () => {
      service.ngOnDestroy();
      expect(mockYoutubePlayer.destroy).toHaveBeenCalled();
    });

    it('should unsubscribe from error$ on ngOnDestroy', () => {
      service.ngOnDestroy();
      // After destroy, emitting an error should not update the store
      playerStore.clearError();
      mockYoutubePlayer.error$.next('error_after_destroy');
      expect(playerStore.errorMessage()).toBeNull();
    });

    it('should call uiStore.openAddVideoModal on addVideoInPlaylist', () => {
      const uiStore = TestBed.inject(UiStore);
      const spy = vi.spyOn(uiStore, 'openAddVideoModal');

      service.addVideoInPlaylist('testKey', 'testArtist', 'testTitle', 123);

      expect(spy).toHaveBeenCalledWith({
        key: 'testKey',
        artist: 'testArtist',
        title: 'testTitle',
        duration: 123,
      });
    });

    it('should add playlist to queue via store on addInCurrentList', () => {
      const playlist = [mockVideo({ key: '1' }), mockVideo({ key: '2' }), mockVideo({ key: '3' })];
      service.addInCurrentList(playlist);

      expect(queueStore.items()).toEqual(playlist);
      expect(queueStore.tabIndexOriginal()).toEqual([0, 1, 2]);
      expect(queueStore.tabIndex()).toEqual([0, 1, 2]);
    });

    it('should update store tabIndex on addInCurrentList when shuffled', () => {
      const videos = [
        mockVideo({ key: 'k1', id_video: '1' }),
        mockVideo({ key: 'k2', id_video: '2' }),
      ];
      queueStore.setQueue(videos, null, null);
      queueStore.toggleShuffle();

      const newVideos = [mockVideo({ key: 'k3', id_video: '3' })];
      service.addInCurrentList(newVideos);

      // Store should have all 3 items
      expect(queueStore.items()).toHaveLength(3);
      expect(queueStore.tabIndexOriginal()).toEqual([0, 1, 2]);
    });

    it('should add video after current via store on addVideoAfterCurrentInList', () => {
      const videos = [
        mockVideo({ key: 'k1', id_video: '1' }),
        mockVideo({ key: 'k2', id_video: '2' }),
      ];
      queueStore.setQueue(videos, null, null);

      const newVideo = mockVideo({ key: 'k3', id_video: '3' });
      service.addVideoAfterCurrentInList(newVideo);

      expect(queueStore.items()).toHaveLength(3);
      // After moving to next, we should hit the inserted video
      queueStore.next();
      expect(queueStore.currentVideo()?.key).toBe('k3');
    });

    it('should set queue via store and call lecture on runPlaylist', () => {
      const spySetQueue = vi.spyOn(queueStore, 'setQueue');
      const spyLecture = vi.spyOn(service, 'lecture').mockImplementation(() => {
        // Mock to prevent actual YouTube calls
      });

      const playlist = [mockVideo({ key: '2' }), mockVideo({ key: '3' })];
      service.runPlaylist(playlist, 1);

      expect(spySetQueue).toHaveBeenCalled();
      expect(spyLecture).toHaveBeenCalledWith(1, true);
    });

    it('should pass playlistId to queueStore.setQueue when provided', () => {
      vi.spyOn(service, 'lecture').mockImplementation(() => {
        // Mock to prevent actual YouTube calls
      });
      const spySetQueue = vi.spyOn(queueStore, 'setQueue');

      const playlist = [
        mockVideo({ key: '2', id_playlist: 'default123' }),
        mockVideo({ key: '3' }),
      ];
      service.runPlaylist(playlist, 0, 'top123', 'playlist456');

      expect(spySetQueue).toHaveBeenCalledWith(playlist, 'playlist456', 'top123');
    });

    it('should not call queueStore.setQueue or lecture when playlist is empty', () => {
      const spyLecture = vi.spyOn(service, 'lecture');
      const spySetQueue = vi.spyOn(queueStore, 'setQueue');

      service.runPlaylist([], 0);

      expect(spyLecture).not.toHaveBeenCalled();
      expect(spySetQueue).not.toHaveBeenCalled();
    });

    it('should set error in PlayerStore when YoutubePlayerService emits error$', () => {
      mockYoutubePlayer.error$.next('error_request_not_found');

      expect(playerStore.errorMessage()).toBe('error_request_not_found');
    });

    it('should clear error via YoutubePlayerService on clearErrorMessage', () => {
      service.clearErrorMessage();
      expect(mockYoutubePlayer.clearError).toHaveBeenCalled();
    });

    describe('Shuffle regression', () => {
      const shuffleVideos: Video[] = [
        mockVideo({ key: 'key1', id_video: 'v1', titre: 'Song 1', artiste: 'Artist 1' }),
        mockVideo({ key: 'key2', id_video: 'v2', titre: 'Song 2', artiste: 'Artist 2' }),
        mockVideo({ key: 'key3', id_video: 'v3', titre: 'Song 3', artiste: 'Artist 3' }),
        mockVideo({ key: 'key4', id_video: 'v4', titre: 'Song 4', artiste: 'Artist 4' }),
      ];

      it('should keep store state consistent after enabling shuffle', () => {
        setupQueue(shuffleVideos);
        service.switchRandom();

        expect(queueStore.isShuffled()).toBe(true);
        // tabIndex should contain all indices
        expect(queueStore.tabIndex().sort()).toEqual([0, 1, 2, 3]);
      });

      it('should play the correct video and update store currentKey when clicking a track with shuffle active', () => {
        setupQueue(shuffleVideos);
        service.switchRandom();

        // Click on item at index 2 in items[] (indexInitial=true, as in the template)
        service.lecture(2, true);

        // The video loaded must be the one at items[2]
        expect(mockYoutubePlayer.loadVideo).toHaveBeenCalledWith('key3');
        expect(queueStore.currentKey()).toBe('key3');
      });

      it('should keep store currentKey in sync with played video during sequential navigation with shuffle', () => {
        setupQueue(shuffleVideos);
        service.switchRandom();

        // Play first in shuffle order
        service.lecture(0);
        const firstKey = queueStore.currentKey();

        // Navigate to next
        service.after();
        const secondKey = queueStore.currentKey();
        expect(secondKey).not.toBe(firstKey);
      });

      it('should correctly navigate back with before() while shuffle is active', () => {
        setupQueue(shuffleVideos);
        service.switchRandom();

        // Go to position 1, then back to 0
        service.lecture(1);
        const keyAtPos1 = queueStore.currentKey();

        service.lecture(0);
        const keyAtPos0 = queueStore.currentKey();

        service.after(); // go to pos 1
        expect(queueStore.currentKey()).toBe(keyAtPos1);

        service.before(); // back to pos 0
        expect(queueStore.currentKey()).toBe(keyAtPos0);
      });

      it('should maintain the current video after disabling shuffle', () => {
        setupQueue(shuffleVideos);

        // Play track at index 2
        service.lecture(2, true);
        const playingKey = queueStore.currentKey();

        // Enable shuffle
        service.switchRandom();
        expect(queueStore.currentKey()).toBe(playingKey);

        // Disable shuffle
        service.switchRandom();
        expect(queueStore.currentKey()).toBe(playingKey);
      });

      it('should return same currentKey from store after lecture with indexInitial=true and shuffle', () => {
        setupQueue(shuffleVideos);
        service.switchRandom();

        // For every item index, clicking it should always produce matching keys
        for (let i = 0; i < shuffleVideos.length; i++) {
          service.lecture(i, true);
          expect(queueStore.currentKey()).toBe(shuffleVideos[i].key);
        }
      });

      it('should maintain consistent store state after runPlaylist with shuffle already active', () => {
        setupQueue(shuffleVideos);
        service.switchRandom();

        // Start a new playlist while shuffle is still on
        const newVideos = shuffleVideos.slice(0, 2);
        service.runPlaylist(newVideos, 0, null, 'p2');

        expect(queueStore.items()).toEqual(newVideos);
        expect(queueStore.tabIndex().sort()).toEqual([0, 1]);
      });

      it('should not desync after removeToPlaylist while shuffle is active', () => {
        setupQueue(shuffleVideos);
        service.switchRandom();

        // Play the first track in shuffle order
        service.lecture(0);
        const currentKeyBefore = queueStore.currentKey();

        // Find which item index the 2nd track in shuffle order maps to, and remove it
        const secondItemIdx = queueStore.tabIndex()[1];
        service.removeToPlaylist(secondItemIdx);

        // Current track should be unchanged
        expect(queueStore.currentKey()).toBe(currentKeyBefore);
      });
    });
  });

  describe('In server environment', () => {
    let service: PlayerService;
    let mockYoutubePlayer: ReturnType<typeof createMockYoutubePlayerService>;

    beforeEach(() => {
      mockYoutubePlayer = createMockYoutubePlayerService();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initServiceMock: any = { init: vi.fn(), onMessageUnlog: vi.fn() };
      TestBed.configureTestingModule({
        imports: [],
        providers: [
          getTranslocoTestingProviders(),
          {
            provide: Title,
            useValue: {
              setTitle: () => {
                // Mock setTitle
              },
            },
          },
          {
            provide: InitService,
            useValue: initServiceMock,
          },
          {
            provide: PLATFORM_ID,
            useValue: 'server',
          },
          {
            provide: YoutubePlayerService,
            useValue: mockYoutubePlayer,
          },
          {
            provide: UserLibraryService,
            useValue: {},
          },
          PlayerService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting(),
        ],
      }).compileComponents();

      service = TestBed.inject(PlayerService);
    });

    it('should detect server context', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).isBrowser).toBe(false);
    });

    it('should not call youtubePlayer.initPlayer on server', () => {
      expect(mockYoutubePlayer.initPlayer).not.toHaveBeenCalled();
    });
  });
});
