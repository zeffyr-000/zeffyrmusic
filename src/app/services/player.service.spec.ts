import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { InitService } from './init.service';
import { PlayerService } from './player.service';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { UserVideo, Video } from '../models/video.model';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { UserPlaylist } from '../models/playlist.model';
import { FollowItem } from '../models/follow.model';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { PLATFORM_ID } from '@angular/core';
import { YoutubePlayerService } from './youtube-player.service';
import { UserLibraryService } from './user-library.service';
import { PlayerStore } from '../store/player/player.store';
import { UserDataStore } from '../store/user-data/user-data.store';
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
    let initService: InitService;
    let translocoService: TranslocoService;
    let mockYoutubePlayer: ReturnType<typeof createMockYoutubePlayerService>;
    let playerStore: InstanceType<typeof PlayerStore>;

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
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize local properties from QueueStore via effect', () => {
      const queueStore = TestBed.inject(QueueStore);
      const videos = [{ key: 'key1', titre: 'title1', artiste: 'artist1' }] as Video[];

      // Simuler l'initialisation du QueueStore
      queueStore.setQueue(videos, null, null);

      // L'effet devrait synchroniser les propriétés locales
      // Note: Les effets s'exécutent de manière asynchrone, vérifier via les signaux du store
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

    it('should remove video and call callback on removeVideo', () => {
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

      const httpClient = TestBed.inject(HttpClient);
      const httpClientSpy = vi.spyOn(httpClient, 'get').mockReturnValue(of({ success: true }));

      const callbackSuccess = vi.fn();

      service.removeVideo('2', callbackSuccess);

      expect(httpClientSpy).toHaveBeenCalledWith(environment.URL_SERVER + 'supprimer/' + '2');
      expect(service.listVideo.length).toBe(2);
      expect(callbackSuccess).toHaveBeenCalled();
    });

    it('should catch error on removeVideo', () => {
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

      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(throwError('error'));

      const callbackSuccess = vi.fn();

      service.removeVideo('2', callbackSuccess);

      expect(initService.onMessageUnlog).toHaveBeenCalled();
      expect(callbackSuccess).not.toHaveBeenCalled();
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

    it('should clear the refInterval on video pause', () => {
      service.refInterval = 123;
      mockYoutubePlayer.stateChange$.next(2); // PAUSED
      expect(service.refInterval).toBe(null);
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

    it('should load lists and call userDataStore methods on onLoadListLogin', () => {
      const userDataStore = TestBed.inject(UserDataStore);
      const spySetPlaylists = vi.spyOn(userDataStore, 'setPlaylists');
      const spySetFollows = vi.spyOn(userDataStore, 'setFollows');
      const spySetLikedVideos = vi.spyOn(userDataStore, 'setLikedVideos');

      const listPlaylist: UserPlaylist[] = [{ id_playlist: '1', titre: 'Test', prive: false }];
      const listFollow: FollowItem[] = [{ id_playlist: '1', titre: 'Test' }];
      const listLike: UserVideo[] = [
        { id: '1', key: 'XXX', titre: 'Test', duree: '100', artiste: 'Test' },
      ];
      service.onLoadListLogin(listPlaylist, listFollow, listLike);

      // Verify userDataStore is updated (local properties were removed)
      expect(spySetPlaylists).toHaveBeenCalledWith(listPlaylist);
      expect(spySetFollows).toHaveBeenCalledWith(listFollow);
      expect(spySetLikedVideos).toHaveBeenCalledWith(listLike);
    });

    it('should add new playlist and update userDataStore on addNewPlaylist', () => {
      const userDataStore = TestBed.inject(UserDataStore);
      const spy = vi.spyOn(userDataStore, 'addPlaylist');

      const idPlaylist = '1';
      const title = 'Test';
      service.addNewPlaylist(idPlaylist, title);

      // Les propriétés locales ont été supprimées, on vérifie uniquement l'appel au store
      expect(spy).toHaveBeenCalledWith({
        id_playlist: idPlaylist,
        titre: title,
        prive: false,
      });
    });

    it('should edit playlist title and update userDataStore on editPlaylistTitle', () => {
      const userDataStore = TestBed.inject(UserDataStore);
      const spy = vi.spyOn(userDataStore, 'updatePlaylistTitle');
      const idPlaylist = '2';
      const newTitle = 'New Test';
      service.editPlaylistTitle(idPlaylist, newTitle);

      // Les propriétés locales ont été supprimées, on vérifie uniquement l'appel au store
      expect(spy).toHaveBeenCalledWith(idPlaylist, newTitle);
    });

    it('should update player running on playerRunning', () => {
      mockYoutubePlayer.getCurrentTime.mockReturnValue(120);
      mockYoutubePlayer.getDuration.mockReturnValue(300);
      mockYoutubePlayer.getLoadedFraction.mockReturnValue(0.5);

      service.playerRunning();

      expect(mockYoutubePlayer.getCurrentTime).toHaveBeenCalled();
      expect(mockYoutubePlayer.getDuration).toHaveBeenCalled();
      expect(mockYoutubePlayer.getLoadedFraction).toHaveBeenCalled();
      expect(playerStore.currentTime()).toBe(120);
      expect(playerStore.duration()).toBe(300);
      expect(playerStore.loadedFraction()).toBe(0.5);
    });

    it('should update player running on playerRunning when player is not ready', () => {
      mockYoutubePlayer.getCurrentTime.mockReturnValue(undefined);
      mockYoutubePlayer.getDuration.mockReturnValue(undefined);
      mockYoutubePlayer.getLoadedFraction.mockReturnValue(undefined);

      service.playerRunning();

      expect(mockYoutubePlayer.getCurrentTime).toHaveBeenCalled();
      expect(mockYoutubePlayer.getDuration).toHaveBeenCalled();
      expect(mockYoutubePlayer.getLoadedFraction).toHaveBeenCalled();
      // PlayerStore should be updated with undefined currentTime but not duration/loadedFraction
      expect(playerStore.currentTime()).toBeUndefined();
    });

    it('should update player running on playerRunning with empty values', () => {
      mockYoutubePlayer.getCurrentTime.mockReturnValue(10);
      mockYoutubePlayer.getDuration.mockReturnValue(30);
      mockYoutubePlayer.getLoadedFraction.mockReturnValue(0.5);

      service.playerRunning();

      expect(mockYoutubePlayer.getCurrentTime).toHaveBeenCalled();
      expect(mockYoutubePlayer.getDuration).toHaveBeenCalled();
      expect(mockYoutubePlayer.getLoadedFraction).toHaveBeenCalled();
      expect(playerStore.currentTime()).toBe(10);
      expect(playerStore.duration()).toBe(30);
      expect(playerStore.loadedFraction()).toBe(0.5);
    });

    it('should switch playlist visibility and update userDataStore on switchVisibilityPlaylist', () => {
      const userDataStore = TestBed.inject(UserDataStore);
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ success: true }));

      const spyToggle = vi.spyOn(userDataStore, 'togglePlaylistVisibility');
      const idPlaylist = '2';
      const isPrivate = true;
      service.switchVisibilityPlaylist(idPlaylist, isPrivate);

      // Les propriétés locales ont été supprimées, on vérifie uniquement l'appel au store
      expect(spyToggle).toHaveBeenCalledWith(idPlaylist, isPrivate);
      expect(initService.onMessageUnlog).not.toHaveBeenCalled();

      service.switchVisibilityPlaylist(idPlaylist, false);
      expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should catch error on switchVisibilityPlaylist', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(throwError('error'));

      const idPlaylist = '2';
      const isPrivate = true;
      service.switchVisibilityPlaylist(idPlaylist, isPrivate);

      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });

    it('should delete playlist and update userDataStore on deletePlaylist', () => {
      const userDataStore = TestBed.inject(UserDataStore);
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ success: true }));
      const spyRemove = vi.spyOn(userDataStore, 'removePlaylist');

      const idPlaylist = '2';
      service.deletePlaylist(idPlaylist);

      // Les propriétés locales ont été supprimées, on vérifie uniquement l'appel au store
      expect(spyRemove).toHaveBeenCalledWith(idPlaylist);
      expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should catch error on deletePlaylist', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(throwError('error'));

      const idPlaylist = '2';
      service.deletePlaylist(idPlaylist);

      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });

    it('should call switchFollow on deleteFollow', () => {
      const spySwitchFollow = vi.spyOn(service, 'switchFollow');

      const idPlaylist = '2';
      service.deleteFollow(idPlaylist);

      expect(spySwitchFollow).toHaveBeenCalledWith(idPlaylist);
    });

    it('should add playlist to listFollow and update userDataStore on switchFollow', () => {
      const userDataStore = TestBed.inject(UserDataStore);
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ success: true, est_suivi: true }));

      const spyAddFollow = vi.spyOn(userDataStore, 'addFollow');
      const idPlaylist = '2';
      const title = 'Test';
      const artist = 'Test Artist';
      const url_image = 'test.jpg';
      service.switchFollow(idPlaylist, title, artist, url_image);

      // Les propriétés locales ont été supprimées, on vérifie uniquement l'appel au store
      expect(spyAddFollow).toHaveBeenCalledWith({
        id_playlist: idPlaylist,
        titre: title,
        artiste: artist,
        url_image,
      });
      expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should remove playlist from userDataStore on switchFollow', () => {
      const userDataStore = TestBed.inject(UserDataStore);

      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ success: true, est_suivi: false }));

      const spyRemoveFollow = vi.spyOn(userDataStore, 'removeFollow');

      const idPlaylist = '2';
      service.switchFollow(idPlaylist);

      expect(spyRemoveFollow).toHaveBeenCalledWith(idPlaylist);
    });

    it('should catch error on switchFollow', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(throwError('error'));

      const idPlaylist = '2';
      service.switchFollow(idPlaylist);

      expect(initService.onMessageUnlog).toHaveBeenCalled();
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

    it('should post request on addVideoInPlaylistRequest', () => {
      const httpClient = TestBed.inject(HttpClient);
      const postSpy = vi.spyOn(httpClient, 'post').mockReturnValue(of({ success: true }));

      const idPlaylist = '2';
      const addKey = 'testKey';
      const addTitle = 'testTitle';
      const addArtist = 'testArtist';
      const addDuration = 123;
      service.addVideoInPlaylistRequest(idPlaylist, addKey, addTitle, addArtist, addDuration);

      expect(postSpy).toHaveBeenCalled();
      expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should catch error on addVideoInPlaylistRequest', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'post').mockReturnValue(throwError('error'));

      const idPlaylist = '2';
      const addKey = 'testKey';
      const addTitle = 'testTitle';
      const addArtist = 'testArtist';
      const addDuration = 123;
      service.addVideoInPlaylistRequest(idPlaylist, addKey, addTitle, addArtist, addDuration);

      expect(initService.onMessageUnlog).toHaveBeenCalled();
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

    it('should handle errors from YoutubePlayerService error$', () => {
      const errorMessageSpy = vi.fn();
      service.errorMessage$.subscribe(errorMessageSpy);

      mockYoutubePlayer.error$.next('error_request_not_found');

      expect(errorMessageSpy).toHaveBeenCalledWith('error_request_not_found');
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
