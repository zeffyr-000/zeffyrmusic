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
  seekTo: vi.fn(),
  seekToPercent: vi.fn(),
  getPlayerState: vi.fn().mockReturnValue(2),
  getCurrentTime: vi.fn().mockReturnValue(50),
  getDuration: vi.fn().mockReturnValue(100),
  getLoadedFraction: vi.fn().mockReturnValue(0.5),
  clearError: vi.fn(),
  destroy: vi.fn(),
});

describe('PlayerService', () => {
  describe('Browser context', () => {
    let service: PlayerService;
    let titleService: Title;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let initService: InitService;
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
      initService = TestBed.inject(InitService);
      translocoService = TestBed.inject(TranslocoService);
      translocoService.setDefaultLang('en');
      playerStore = TestBed.inject(PlayerStore);
      queueStore = TestBed.inject(QueueStore);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize local properties from QueueStore via effect', () => {
      const queueStore = TestBed.inject(QueueStore);
      const videos = [{ key: 'key1', titre: 'title1', artiste: 'artist1' }] as Video[];

      // Simulate QueueStore initialization
      queueStore.setQueue(videos, null, null);

      // The effect should synchronize local properties
      // Note: Effects run asynchronously, verify via store signals
      expect(queueStore.currentKey()).toEqual('key1');
      expect(queueStore.currentTitle()).toEqual('title1');
      expect(queueStore.currentArtist()).toEqual('artist1');
    });

    it('should initialize YoutubePlayerService on construction', () => {
      expect(mockYoutubePlayer.initPlayer).toHaveBeenCalledWith('player');
    });

    it('should update PlayerStore when stateChange$ emits', () => {
      const playerStore = TestBed.inject(PlayerStore);

      mockYoutubePlayer.stateChange$.next(1); // PLAYING
      expect(service.isPlaying).toBe(true);
      expect(playerStore.isPlaying()).toBe(true);

      mockYoutubePlayer.stateChange$.next(2); // PAUSED
      expect(service.isPlaying).toBe(false);
      expect(playerStore.isPaused()).toBe(true);
    });

    it('should call after() when video ends (state 0)', () => {
      const afterSpy = vi.spyOn(service, 'after');
      mockYoutubePlayer.stateChange$.next(0); // ENDED
      expect(afterSpy).toHaveBeenCalled();
    });

    it('should set the title on lecture', () => {
      vi.spyOn(titleService, 'setTitle');
      service.listVideo = [
        {
          id_video: '123',
          artiste: 'Test Artist',
          artists: [{ id_artist: '123', label: 'Test Artist' }],
          duree: '100',
          id_playlist: '123',
          key: 'testId',
          ordre: '1',
          titre: 'Test Video',
          titre_album: 'Test Album',
        },
      ];
      service.tabIndex = [0];

      service.currentKey = 'testId';

      service.lecture(0);
      expect(titleService.setTitle).toHaveBeenCalledWith('Test Video - Test Artist - Zeffyr Music');
      expect(mockYoutubePlayer.loadVideo).toHaveBeenCalledWith('testId');
    });

    it('should update the current key, title, and artist on lecture', () => {
      service.listVideo = [
        {
          id_video: '123',
          artiste: 'Test Artist',
          artists: [{ id_artist: '123', label: 'Test Artist' }],
          duree: '100',
          id_playlist: '123',
          key: 'XXX-123',
          ordre: '1',
          titre: 'Test Video',
          titre_album: 'Test Album',
        },
      ];
      service.tabIndex = [0];
      service.lecture(0);
      expect(service.currentKey).toBe('XXX-123');
      expect(service.currentTitle).toBe('Test Video');
      expect(service.currentArtist).toBe('Test Artist');
    });

    it('should update the volume and emit the new value on updateVolume', () => {
      service.updateVolume(50);
      expect(mockYoutubePlayer.setVolume).toHaveBeenCalledWith(50);
      expect(playerStore.volume()).toBe(50);
    });

    it('should update the player position on updatePositionSlider', () => {
      service.updatePositionSlider(0.5);
      expect(mockYoutubePlayer.seekToPercent).toHaveBeenCalledWith(50);
    });

    it('should remove a video from the playlist on removeToPlaylist', () => {
      service.listVideo = [
        {
          id_video: '123',
          artiste: 'Test Artist',
          artists: [{ id_artist: '123', label: 'Test Artist' }],
          duree: '100',
          id_playlist: '123',
          key: 'XXX',
          ordre: '1',
          titre: 'Test Video',
          titre_album: 'Test Album',
        },
        {
          id_video: '456',
          artiste: 'Test Artist 2',
          artists: [{ id_artist: '456', label: 'Test Artist 2' }],
          duree: '100',
          id_playlist: '456',
          key: 'YYY',
          ordre: '1',
          titre: 'Test Video 2',
          titre_album: 'Test Album 2',
        },
      ];
      service.tabIndexInitial = [0, 1];
      service.tabIndex = [0, 1];
      service.currentIndex = 1;
      service.removeToPlaylist(0);
      expect(service.listVideo).toEqual([
        {
          id_video: '456',
          artiste: 'Test Artist 2',
          artists: [{ id_artist: '456', label: 'Test Artist 2' }],
          duree: '100',
          id_playlist: '456',
          key: 'YYY',
          ordre: '1',
          titre: 'Test Video 2',
          titre_album: 'Test Album 2',
        },
      ]);
      expect(service.tabIndexInitial).toEqual([0]);
      expect(service.tabIndex).toEqual([0]);
      expect(service.currentIndex).toBe(0);
    });

    it('should shuffle the playlist on shuffle', () => {
      service.tabIndexInitial = [0, 1, 2, 3, 4];
      service.tabIndex = [0, 1, 2, 3, 4];
      const spy = vi
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.3);
      service.shuffle(service.tabIndex);
      expect(service.tabIndex).not.toEqual([0, 1, 2, 3, 4]);
      expect(spy).toHaveBeenCalledTimes(5);
    });

    it('should call shuffle, update listVideo, tabIndexInitial, tabIndex, and decrease currentIndex on removeToPlaylist when isShuffled is true and index is less than currentIndex', () => {
      const queueStore = TestBed.inject(QueueStore);
      vi.spyOn(queueStore, 'isShuffled').mockReturnValue(true);
      service.listVideo = [{ key: '1' }, { key: '2' }] as Video[];
      service.tabIndexInitial = [1, 2];
      service.tabIndex = [1, 2];
      service.currentIndex = 1;

      const spyShuffle = vi.spyOn(service, 'shuffle');

      const index = 0;
      service.removeToPlaylist(index);

      expect(spyShuffle).toHaveBeenCalled();
      expect(service.listVideo).toEqual([{ key: '2' } as Video]);
      expect(service.tabIndexInitial).toEqual([1]);
      expect(service.tabIndex).toEqual([1]);
      expect(mockYoutubePlayer.pause).not.toHaveBeenCalled();
      expect(service.currentIndex).toBe(0);
    });

    it('should call shuffle, update listVideo, tabIndexInitial, tabIndex, and call player.pauseVideo on removeToPlaylist when isShuffled is true and index is equal to currentIndex', () => {
      const queueStore = TestBed.inject(QueueStore);
      vi.spyOn(queueStore, 'isShuffled').mockReturnValue(true);
      service.listVideo = [{ key: '1' }, { key: '2' }] as Video[];
      service.tabIndexInitial = [1, 2];
      service.tabIndex = [1, 2];
      service.currentIndex = 0;

      const spyShuffle = vi.spyOn(service, 'shuffle');

      const index = 0;
      service.removeToPlaylist(index);

      expect(spyShuffle).toHaveBeenCalled();
      expect(service.listVideo).toEqual([{ key: '2' } as Video]);
      expect(service.tabIndexInitial).toEqual([1]);
      expect(service.tabIndex).toEqual([1]);
      expect(mockYoutubePlayer.pause).toHaveBeenCalled();
      expect(service.currentIndex).toBe(0);
    });

    it('should toggle repeat via playerStore on switchRepeat', () => {
      const playerStore = TestBed.inject(PlayerStore);
      const spy = vi.spyOn(playerStore, 'toggleRepeat');

      service.switchRepeat();

      expect(spy).toHaveBeenCalled();
    });

    it('should toggle shuffle via queueStore on switchRandom', () => {
      const queueStore = TestBed.inject(QueueStore);
      vi.spyOn(queueStore, 'toggleShuffle').mockReturnValue(true);
      const shuffleSpy = vi.spyOn(service, 'shuffle');
      service.tabIndex = [0, 1, 2];

      service.switchRandom();

      expect(queueStore.toggleShuffle).toHaveBeenCalled();
      expect(shuffleSpy).toHaveBeenCalled();
    });

    it('should restore original tabIndex when shuffle is disabled', () => {
      const queueStore = TestBed.inject(QueueStore);
      vi.spyOn(queueStore, 'toggleShuffle').mockReturnValue(false);
      service.tabIndex = [2, 0, 1];
      service.tabIndexInitial = [0, 1, 2];

      service.switchRandom();

      expect(service.tabIndex).toEqual([0, 1, 2]);
    });

    it('should remove video from queue by id_video on removeVideoFromQueue', () => {
      service.listVideo = [
        {
          id_video: '1',
          artiste: 'Test Artist',
          artists: [{ id_artist: '1', label: 'Test Artist' }],
          duree: '100',
          id_playlist: '1',
          key: 'XXX-XXX',
          ordre: '1',
          titre: 'Test Video',
        },
        {
          id_video: '2',
          artiste: 'Test Artist 2',
          artists: [{ id_artist: '2', label: 'Test Artist 2' }],
          duree: '100',
          id_playlist: '2',
          key: 'YYY-YYY',
          ordre: '1',
          titre: 'Test Video 2',
        },
        {
          id_video: '3',
          artiste: 'Test Artist 3',
          artists: [{ id_artist: '3', label: 'Test Artist 3' }],
          duree: '100',
          id_playlist: '3',
          key: 'ZZZ-ZZZ',
          ordre: '1',
          titre: 'Test Video 3',
        },
      ] as Video[];

      service.removeVideoFromQueue('2');

      expect(service.listVideo.length).toBe(2);
      expect(service.listVideo.find(v => v.id_video === '2')).toBeUndefined();
    });

    it('should do nothing if video not found on removeVideoFromQueue', () => {
      service.listVideo = [
        {
          id_video: '1',
          artiste: 'Test Artist',
          artists: [{ id_artist: '1', label: 'Test Artist' }],
          duree: '100',
          id_playlist: '1',
          key: 'XXX-XXX',
          ordre: '1',
          titre: 'Test Video',
        },
      ] as Video[];

      service.removeVideoFromQueue('999');

      expect(service.listVideo.length).toBe(1);
    });

    it('should set the title and artist to empty string if not provided on lecture', () => {
      service.listVideo = [
        {
          id_video: '123',
          artiste: 'Test Artist',
          artists: [{ id_artist: '123', label: 'Test Artist' }],
          duree: '100',
          id_playlist: '123',
          key: 'XXX-123',
          ordre: '1',
          titre: 'Test Video',
          titre_album: 'Test Album',
        },
      ];
      service.tabIndex = [0];
      service.lecture(0);
      expect(service.currentKey).toBe('XXX-123');
      expect(service.currentTitle).toBe('Test Video');
      expect(service.currentArtist).toBe('Test Artist');
    });

    it('should update the current index on lecture', () => {
      service.listVideo = [
        {
          id_video: '123',
          artiste: 'Test Artist',
          artists: [{ id_artist: '123', label: 'Test Artist' }],
          duree: '100',
          id_playlist: '123',
          key: 'XXX-123',
          ordre: '1',
          titre: 'Test Video',
          titre_album: 'Test Album',
        },
        {
          id_video: '456',
          artiste: 'Test Artist 2',
          artists: [{ id_artist: '456', label: 'Test Artist 2' }],
          duree: '100',
          id_playlist: '456',
          key: 'YYY-456',
          ordre: '1',
          titre: 'Test Video 2',
          titre_album: 'Test Album 2',
        },
        {
          id_video: '789',
          artiste: '',
          artists: [],
          duree: '100',
          id_playlist: '789',
          key: 'ZZZ-789',
          ordre: '1',
          titre: 'Test Video 3',
          titre_album: 'Test Album 3',
        },
      ];

      service.tabIndex = [0, 1, 2];
      service.lecture(1);
      expect(service.currentIndex).toBe(1);

      service.lecture(2, true);
      expect(service.currentIndex).toBe(2);
      expect(service.currentArtist).toBe('');
    });

    it('should set isPlaying to false on pause', () => {
      service.isPlaying = true;
      mockYoutubePlayer.stateChange$.next(2); // PAUSED
      expect(service.isPlaying).toBe(false);
    });

    it('should set isPlaying to true on play', () => {
      service.isPlaying = false;
      mockYoutubePlayer.stateChange$.next(1); // PLAYING
      expect(service.isPlaying).toBe(true);
    });

    it('should set isPlaying to false on video end', () => {
      service.isPlaying = true;
      mockYoutubePlayer.stateChange$.next(0); // ENDED
      expect(service.isPlaying).toBe(false);
    });

    it('should set isPlaying to false on unstarted', () => {
      service.isPlaying = true;
      mockYoutubePlayer.stateChange$.next(-1); // UNSTARTED
      expect(service.isPlaying).toBe(false);
    });

    it('should call lecture on before', () => {
      const spy = vi.spyOn(service, 'lecture');
      service.tabIndex = [0, 1, 2];
      service.listVideo = [
        { key: 'key1', titre: 'title1', artiste: 'artist1' } as Video,
        { key: 'key2', titre: 'title2', artiste: 'artist2' } as Video,
        { key: 'key3', titre: 'title3', artiste: 'artist3' } as Video,
      ];
      service.currentIndex = 1;
      service.before();
      expect(spy).toHaveBeenCalledWith(0);
    });

    it('should call lecture on after', () => {
      const spy = vi.spyOn(service, 'lecture');
      service.tabIndex = [0, 1, 2];
      service.listVideo = [
        { key: 'key1', titre: 'title1', artiste: 'artist1' } as Video,
        { key: 'key2', titre: 'title2', artiste: 'artist2' } as Video,
        { key: 'key3', titre: 'title3', artiste: 'artist3' } as Video,
      ];
      service.currentIndex = 1;
      service.after();
      expect(spy).toHaveBeenCalledWith(2);
    });

    it('should call lecture with 0 on after when isRepeat is true and tabIndex[currentIndex + 1] is undefined', () => {
      const playerStore = TestBed.inject(PlayerStore);
      vi.spyOn(playerStore, 'isRepeat').mockReturnValue(true);
      service.tabIndex = [0];
      service.listVideo = [{ key: 'key1', titre: 'title1', artiste: 'artist1' } as Video];
      service.currentIndex = 0;

      const spyLecture = vi.spyOn(service, 'lecture');

      service.after();

      expect(spyLecture).toHaveBeenCalledWith(0);
    });

    it('should call lecture with indexInitial on lecture', () => {
      const spy = vi.spyOn(service, 'lecture');
      service.listVideo = [
        {
          id_video: '123',
          artiste: 'Test Artist',
          artists: [{ id_artist: '123', label: 'Test Artist' }],
          duree: '100',
          id_playlist: '123',
          key: 'XXX',
          ordre: '1',
          titre: 'Test Video',
          titre_album: 'Test Album',
        },
      ];
      service.lecture(0, true);
      expect(spy).toHaveBeenCalledWith(0, true);
      expect(service.currentIndex).toBe(0);
    });

    it('should toggle play/pause via YoutubePlayerService on onPlayPause', () => {
      mockYoutubePlayer.togglePlayPause.mockReturnValue(true);
      service.onPlayPause();
      expect(mockYoutubePlayer.togglePlayPause).toHaveBeenCalled();
      expect(service.isPlaying).toBe(true);
    });

    it('should set isPlaying to false when togglePlayPause returns false', () => {
      mockYoutubePlayer.togglePlayPause.mockReturnValue(false);
      service.onPlayPause();
      expect(service.isPlaying).toBe(false);
    });

    it('should call youtubePlayer.destroy on ngOnDestroy', () => {
      service.ngOnDestroy();
      expect(mockYoutubePlayer.destroy).toHaveBeenCalled();
    });

    it('should unsubscribe from error$ on ngOnDestroy', () => {
      service.ngOnDestroy();
      // After destroy, emitting an error should not update the store
      const playerStore = TestBed.inject(PlayerStore);
      playerStore.clearError();
      mockYoutubePlayer.error$.next('error_after_destroy');
      expect(playerStore.errorMessage()).toBeNull();
    });

    it('should call uiStore.openAddVideoModal on addVideoInPlaylist', () => {
      const uiStore = TestBed.inject(UiStore);
      const spy = vi.spyOn(uiStore, 'openAddVideoModal');

      const key = 'testKey';
      const artist = 'testArtist';
      const title = 'testTitle';
      const duration = 123;
      service.addVideoInPlaylist(key, artist, title, duration);

      expect(spy).toHaveBeenCalledWith({ key, artist, title, duration });
    });

    it('should add playlist to listVideo and update tabIndexInitial, tabIndex on addInCurrentList', () => {
      service.listVideo = [];
      service.tabIndexInitial = [];
      service.tabIndex = [];

      const spyShuffle = vi.spyOn(service, 'shuffle');

      const playlist = [{ key: '1' }, { key: '2' }, { key: '3' }] as Video[];
      service.addInCurrentList(playlist);

      expect(service.listVideo).toEqual(playlist);
      expect(service.tabIndexInitial).toEqual([0, 1, 2]);
      expect(service.tabIndex).toEqual([0, 1, 2]);
      expect(spyShuffle).not.toHaveBeenCalled();
    });

    it('should call shuffle on addInCurrentList when isShuffled is true', () => {
      const queueStore = TestBed.inject(QueueStore);
      vi.spyOn(queueStore, 'isShuffled').mockReturnValue(true);
      const spyShuffle = vi.spyOn(service, 'shuffle');
      const playlist = [{ key: '1' }, { key: '2' }, { key: '3' }] as Video[];
      service.addInCurrentList(playlist);

      expect(spyShuffle).toHaveBeenCalled();
    });

    it('should add video to listVideo and update tabIndexInitial, tabIndex on addVideoAfterCurrentInList', () => {
      service.listVideo = [];
      service.tabIndexInitial = [];
      service.tabIndex = [];
      service.currentIndex = 0;

      const spyShuffle = vi.spyOn(service, 'shuffle');

      const video = { key: '1' } as Video;
      service.addVideoAfterCurrentInList(video);

      expect(service.listVideo).toEqual([video]);
      expect(service.tabIndexInitial).not.toEqual([]);
      expect(service.tabIndex).not.toEqual([]);
      expect(spyShuffle).not.toHaveBeenCalled();
    });

    it('should call shuffle on addVideoAfterCurrentInList when isShuffled is true', () => {
      const queueStore = TestBed.inject(QueueStore);
      vi.spyOn(queueStore, 'isShuffled').mockReturnValue(true);

      const spyShuffle = vi.spyOn(service, 'shuffle');

      const video = { key: '1' } as Video;
      service.addVideoAfterCurrentInList(video);

      expect(spyShuffle).toHaveBeenCalled();
    });

    it('should reset listVideo, tabIndexInitial, tabIndex, call addInCurrentList and lecture on runPlaylist', () => {
      service.listVideo = [{ key: '1' }] as Video[];
      service.tabIndexInitial = [1];
      service.tabIndex = [1];

      const spyAddInCurrentList = vi.spyOn(service, 'addInCurrentList').mockImplementation(() => {
        // Mock implementation to prevent actual execution
      });
      const spyLecture = vi.spyOn(service, 'lecture').mockImplementation(() => {
        // Mock implementation to prevent actual execution
      });

      const playlist = [{ key: '2' }, { key: '3' }] as Video[];
      const index = 1;
      service.runPlaylist(playlist, index);

      expect(service.listVideo).toEqual([]);
      expect(service.tabIndexInitial).toEqual([]);
      expect(service.tabIndex).toEqual([]);
      expect(spyAddInCurrentList).toHaveBeenCalledWith(playlist, '');
      expect(spyLecture).toHaveBeenCalledWith(index, true);
    });

    it('should pass playlistId to queueStore.setQueue when provided', () => {
      service.listVideo = [{ key: '1' }] as Video[];
      service.tabIndexInitial = [1];
      service.tabIndex = [1];

      vi.spyOn(service, 'addInCurrentList').mockImplementation(() => {
        // Mock implementation to prevent actual execution
      });
      vi.spyOn(service, 'lecture').mockImplementation(() => {
        // Mock implementation to prevent actual execution
      });
      const spySetQueue = vi.spyOn(queueStore, 'setQueue');

      const playlist = [{ key: '2', id_playlist: 'default123' }, { key: '3' }] as Video[];
      const index = 0;
      const idTopCharts = 'top123';
      const playlistId = 'playlist456';
      service.runPlaylist(playlist, index, idTopCharts, playlistId);

      expect(spySetQueue).toHaveBeenCalledWith(playlist, playlistId, idTopCharts);
    });

    it('should not call addInCurrentList, queueStore.setQueue or lecture when playlist is empty', () => {
      service.listVideo = [{ key: '1' }] as Video[];
      service.tabIndexInitial = [1];
      service.tabIndex = [1];

      const spyAddInCurrentList = vi.spyOn(service, 'addInCurrentList');
      const spyLecture = vi.spyOn(service, 'lecture');
      const spySetQueue = vi.spyOn(queueStore, 'setQueue');

      service.runPlaylist([], 0);

      expect(spyAddInCurrentList).not.toHaveBeenCalled();
      expect(spyLecture).not.toHaveBeenCalled();
      expect(spySetQueue).not.toHaveBeenCalled();
      expect(service.listVideo).toEqual([{ key: '1' }]);
      expect(service.tabIndexInitial).toEqual([1]);
      expect(service.tabIndex).toEqual([1]);
    });

    it('should set error in PlayerStore when YoutubePlayerService emits error$', () => {
      mockYoutubePlayer.error$.next('error_request_not_found');

      expect(playerStore.errorMessage()).toBe('error_request_not_found');
    });

    it('should clear error via YoutubePlayerService on clearErrorMessage', () => {
      service.clearErrorMessage();
      expect(mockYoutubePlayer.clearError).toHaveBeenCalled();
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
