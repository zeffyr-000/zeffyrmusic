import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { InitService } from './init.service';
import { PlayerService } from './player.service';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { UserVideo, Video } from '../models/video.model';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { UserPlaylist } from '../models/playlist.model';
import { FollowItem } from '../models/follow.model';
import { getTranslocoTestingProviders } from '../transloco-testing';
import { PLATFORM_ID } from '@angular/core';

describe('PlayerService', () => {
  describe('Browser context', () => {
    let service: PlayerService;
    let titleService: Title;
    let initService: InitService;
    let translocoService: TranslocoService;

    beforeEach(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initServiceMock: any = { init: vi.fn(), onMessageUnlog: vi.fn() };
      initServiceMock.subjectInitializePlaylist = new BehaviorSubject({
        listPlaylist: [],
        listFollow: [],
        listVideo: [
          {
            id_video: '123',
            artiste: 'Test Artist',
            artists: [{ id_artiste: '123', label: 'Test Artist' }],
            duree: '100',
            id_playlist: '123',
            key: 'XXX',
            ordre: '1',
            titre: 'Test Video',
            titre_album: 'Test Album',
          },
        ],
        tabIndex: [0],
        listLikeVideo: [],
      });

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

      const mockPlayer = {
        loadVideoById: vi.fn(),
        setVolume: vi.fn(),
        seekTo: vi.fn(),
        getDuration: () => 100,
        getCurrentTime: () => 50,
        getVideoLoadedFraction: () => 0.5,
        getVolume: () => 50,
        playVideo: vi.fn(),
        getPlayerState: () => 2,
        pauseVideo: vi.fn(),
        cueVideoById: vi.fn(),
      };
      service.player = mockPlayer;
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should update properties and call methods on subjectInitializePlaylist emission', () => {
      const data = {
        listPlaylist: [] as UserPlaylist[],
        listFollow: [] as FollowItem[],
        listVideo: [{ key: 'key1', titre: 'title1', artiste: '' }] as Video[],
        tabIndex: [] as number[],
        listLikeVideo: [] as UserVideo[],
      };
      service.isRandom = true;

      const subjectInitializePlaylistSpy = vi.spyOn(
        service['initService'].subjectInitializePlaylist,
        'next'
      );
      const subjectCurrentKeyChangeSpy = vi.spyOn(service.subjectCurrentKeyChange, 'next');
      const onChangeCurrentPlaylistSpy = vi.spyOn(service, 'onChangeCurrentPlaylist');
      const onChangeListPlaylistSpy = vi.spyOn(service, 'onChangeListPlaylist');
      const onChangeListFollowSpy = vi.spyOn(service, 'onChangeListFollow');
      const onChangeListLikeVideoSpy = vi.spyOn(service, 'onChangeListLikeVideo');

      service['initService'].subjectInitializePlaylist.next(data);

      expect(subjectInitializePlaylistSpy).toHaveBeenCalledWith(data);

      expect(service.listPlaylist).toEqual(data.listPlaylist);
      expect(service.listFollow).toEqual(data.listFollow);
      expect(service.listVideo).toEqual(data.listVideo);
      expect(service.tabIndex).toEqual(data.tabIndex);
      expect(service.listLikeVideo).toEqual(data.listLikeVideo);
      expect(service.currentKey).toEqual(data.listVideo[0].key);
      expect(service.currentTitle).toEqual(data.listVideo[0].titre);
      expect(service.currentArtist).toEqual(data.listVideo[0].artiste);

      expect(subjectCurrentKeyChangeSpy).toHaveBeenCalledWith({
        currentKey: service.currentKey,
        currentTitle: service.currentTitle,
        currentArtist: service.currentArtist,
      });

      expect(onChangeCurrentPlaylistSpy).toHaveBeenCalled();
      expect(onChangeListPlaylistSpy).toHaveBeenCalled();
      expect(onChangeListFollowSpy).toHaveBeenCalled();
      expect(onChangeListLikeVideoSpy).toHaveBeenCalled();
    });

    it('should launch YT API', () => {
      class MockPlayer {
        playerVars;
        events;
        constructor(elementId: string, config: { playerVars: unknown; events: unknown }) {
          this.playerVars = config.playerVars;
          this.events = config.events;
        }
      }

      const mockYT = {
        Player: MockPlayer,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockWindow: any = window;

      if (!mockWindow.onYouTubeIframeAPIReady) {
        mockWindow.onYouTubeIframeAPIReady = () => {
          // Mock callback
        };
      }

      vi.spyOn(mockWindow, 'onYouTubeIframeAPIReady').mockImplementation(() => {
        // Mock spy
      });

      mockWindow.YT = mockYT;

      service.launchYTApi();

      expect(mockWindow.onYouTubeIframeAPIReady).toBeDefined();

      mockWindow.onYouTubeIframeAPIReady();
      expect(service.player).toBeDefined();
    });

    it('should call finvideo on state change', () => {
      const finvideoSpy = vi.spyOn(service, 'finvideo');

      const mockEvent = { data: 123 };

      service.onStateChangeYT(mockEvent);

      expect(finvideoSpy).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle onReadyYT correctly', () => {
      const getVolumeSpy = vi.spyOn(service.player, 'getVolume').mockReturnValue(undefined);
      const updateVolumeSpy = vi.spyOn(service, 'updateVolume');

      service.tabIndex = [0];
      service.listVideo = [{ key: '123' }] as Video[];
      localStorage.volume = '200'; // should be capped to 100

      service.onReadyYT();

      expect(service.player.cueVideoById).toHaveBeenCalledWith(service.listVideo[0].key);
      expect(getVolumeSpy).toHaveBeenCalled();

      getVolumeSpy.mockClear();
      getVolumeSpy.mockReturnValue(50);

      localStorage.volume = '-100';
      service.tabIndex = [];
      service.onReadyYT();

      expect(getVolumeSpy).toHaveBeenCalled();
      expect(updateVolumeSpy).toHaveBeenCalled();
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

      service.currentKey = 'testId';

      service.lecture(0);
      expect(titleService.setTitle).toHaveBeenCalledWith('Test Video - Test Artist - Zeffyr Music');
      expect(service.player.loadVideoById).toHaveBeenCalledWith('testId', 0, 'large');
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
      service.lecture(0);
      expect(service.currentKey).toBe('XXX-123');
      expect(service.currentTitle).toBe('Test Video');
      expect(service.currentArtist).toBe('Test Artist');
    });

    it('should update the volume and emit the new value on updateVolume', () => {
      const spy = vi.spyOn(service.subjectVolumeChange, 'next');
      service.updateVolume(50);
      expect(localStorage.volume).toBe('50');
      expect(service.player.setVolume).toHaveBeenCalledWith(50);
      expect(spy).toHaveBeenCalledWith(50);
    });

    it('should update the player position on updatePositionSlider', () => {
      service.updatePositionSlider(0.5);
      expect(service.player.seekTo).toHaveBeenCalledWith(50);
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

    it('should call shuffle, update listVideo, tabIndexInitial, tabIndex, and decrease currentIndex on removeToPlaylist when isRandom is true and index is less than currentIndex', () => {
      service.isRandom = true;
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
      expect(service.player.pauseVideo).not.toHaveBeenCalled();
      expect(service.currentIndex).toBe(0);
    });

    it('should call shuffle, update listVideo, tabIndexInitial, tabIndex, and call player.pauseVideo on removeToPlaylist when isRandom is true and index is equal to currentIndex', () => {
      service.isRandom = true;
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
      expect(service.player.pauseVideo).toHaveBeenCalled();
      expect(service.currentIndex).toBe(0);
    });

    it('should switch isRepeat and emit new value on switchRepeat', () => {
      service.isRepeat = false;
      vi.spyOn(service.subjectRepeatChange, 'next');

      service.switchRepeat();

      expect(service.isRepeat).toBe(true);
      expect(service.subjectRepeatChange.next).toHaveBeenCalledWith(true);
    });

    it('should switch isRandom and emit new value on switchRandom', () => {
      service.isRandom = false;
      vi.spyOn(service.subjectRandomChange, 'next');

      service.switchRandom();

      expect(service.isRandom).toBe(true);
      expect(service.subjectRandomChange.next).toHaveBeenCalledWith(true);
    });

    it('should switch isRandom and emit new value on switchRandom', () => {
      service.isRandom = true;
      vi.spyOn(service.subjectRandomChange, 'next');

      service.switchRandom();

      expect(service.isRandom).toBe(false);
      expect(service.subjectRandomChange.next).toHaveBeenCalledWith(false);
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
      service.finvideo({ data: 2 });
      expect(service.isPlaying).toBe(false);
    });

    it('should set isPlaying to true on play', () => {
      service.isPlaying = false;
      service.finvideo({ data: 1 });
      expect(service.isPlaying).toBe(true);
    });

    it('should set isPlaying to false on video end', () => {
      service.isPlaying = true;
      service.finvideo({ data: 0 });
      expect(service.isPlaying).toBe(false);
    });

    it('should set isPlaying to false on video end', () => {
      service.isPlaying = true;
      service.finvideo({ data: 0 });
      expect(service.isPlaying).toBe(false);
    });

    it('should set isPlaying to false on video end', () => {
      service.refInterval = 123;
      service.finvideo({ data: -1 });
      expect(service.isPlaying).toBe(false);
    });

    it('should clear the refInterval on video pause', () => {
      service.refInterval = 123;
      service.finvideo({ data: 2 });
      expect(service.refInterval).toBe(null);
    });

    it('should update the volume on subjectVolumeChange', () => {
      service.subjectVolumeChange.next(50);
      expect(service.player.getVolume()).toBe(50);
    });

    it('should call lecture on before', () => {
      const spy = vi.spyOn(service, 'lecture');
      service.tabIndex = [0, 1, 2];
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
      service.isRepeat = true;
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

    it('should call player.playVideo on onPlayPause if paused', () => {
      service.isPlaying = false;

      service.onPlayPause();
      expect(service.player.playVideo).toHaveBeenCalled();
      expect(service.isPlaying).toBe(true);
    });

    it('should call player.pauseVideo on onPlayPause if playing', () => {
      service.isPlaying = true;
      service.player.getPlayerState = () => 1;

      service.onPlayPause();
      expect(service.player.pauseVideo).toHaveBeenCalled();
      expect(service.isPlaying).toBe(false);
    });

    it('should unsubscribe from subscriptionInitializePlaylist on ngOnDestroy', () => {
      const spy = vi.spyOn(service.subscriptionInitializePlaylist, 'unsubscribe');
      service.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('should load lists and call onChange methods on onLoadListLogin', () => {
      const spyPlaylist = vi.spyOn(service, 'onChangeListPlaylist');
      const spyFollow = vi.spyOn(service, 'onChangeListFollow');

      const listPlaylist: UserPlaylist[] = [{ id_playlist: '1', titre: 'Test', prive: false }];
      const listFollow: FollowItem[] = [{ id_playlist: '1', titre: 'Test' }];
      const listLike: UserVideo[] = [
        { id: '1', key: 'XXX', titre: 'Test', duree: '100', artiste: 'Test' },
      ];
      service.onLoadListLogin(listPlaylist, listFollow, listLike);

      expect(service.listPlaylist).toEqual(listPlaylist);
      expect(service.listFollow).toEqual(listFollow);
      expect(spyPlaylist).toHaveBeenCalled();
      expect(spyFollow).toHaveBeenCalled();
    });

    it('should add new playlist and call onChangeListPlaylist on addNewPlaylist', () => {
      const spy = vi.spyOn(service, 'onChangeListPlaylist');

      const idPlaylist = '1';
      const title = 'Test';
      service.addNewPlaylist(idPlaylist, title);

      expect(service.listPlaylist[0]).toEqual({
        id_playlist: idPlaylist,
        titre: title,
        prive: false,
      });
      expect(spy).toHaveBeenCalled();
    });

    it('should edit playlist title and call onChangeListPlaylist on editPlaylistTitle', () => {
      service.listPlaylist = [
        { id_playlist: '1', titre: 'Test1', prive: false },
        { id_playlist: '2', titre: 'Test2', prive: false },
        { id_playlist: '3', titre: 'Test3', prive: false },
      ];

      const spy = vi.spyOn(service, 'onChangeListPlaylist');
      const idPlaylist = '2';
      const newTitle = 'New Test';
      service.editPlaylistTitle(idPlaylist, newTitle);

      const playlist = service.listPlaylist.find(a => a.id_playlist === idPlaylist);
      expect(playlist.titre).toEqual(newTitle);
      expect(spy).toHaveBeenCalled();
    });

    it('should update player running on playerRunning', () => {
      const spyCurrentTime = vi.spyOn(service.player, 'getCurrentTime').mockReturnValue(120);
      const spyDuration = vi.spyOn(service.player, 'getDuration').mockReturnValue(300);
      const spyLoadedFraction = vi
        .spyOn(service.player, 'getVideoLoadedFraction')
        .mockReturnValue(0.5);

      const spyNext = vi.spyOn(service.subjectPlayerRunningChange, 'next');

      service.playerRunning();

      expect(spyCurrentTime).toHaveBeenCalled();
      expect(spyDuration).toHaveBeenCalled();
      expect(spyLoadedFraction).toHaveBeenCalled();
      expect(spyNext).toHaveBeenCalled();
    });

    it('should update player running on playerRunning when player is not ready', () => {
      const spyCurrentTime = vi.spyOn(service.player, 'getCurrentTime').mockReturnValue(undefined);
      const spyDuration = vi.spyOn(service.player, 'getDuration').mockReturnValue(undefined);
      const spyLoadedFraction = vi
        .spyOn(service.player, 'getVideoLoadedFraction')
        .mockReturnValue(undefined);

      const spyNext = vi.spyOn(service.subjectPlayerRunningChange, 'next');

      service.playerRunning();

      expect(spyCurrentTime).toHaveBeenCalled();
      expect(spyDuration).toHaveBeenCalled();
      expect(spyLoadedFraction).toHaveBeenCalled();
      expect(spyNext).toHaveBeenCalled();
    });

    it('should update player running on playerRunning with empty values', () => {
      const spyCurrentTime = vi.spyOn(service.player, 'getCurrentTime').mockReturnValue(10);
      const spyDuration = vi.spyOn(service.player, 'getDuration').mockReturnValue(30);
      const spyLoadedFraction = vi
        .spyOn(service.player, 'getVideoLoadedFraction')
        .mockReturnValue(0.5);

      const spyNext = vi.spyOn(service.subjectPlayerRunningChange, 'next');

      service.playerRunning();

      expect(spyCurrentTime).toHaveBeenCalled();
      expect(spyDuration).toHaveBeenCalled();
      expect(spyLoadedFraction).toHaveBeenCalled();
      expect(spyNext).toHaveBeenCalled();
    });

    it('should switch playlist visibility and call onChangeListPlaylist on switchVisibilityPlaylist', () => {
      service.listPlaylist = [
        { id_playlist: '1', titre: 'Test1', prive: false },
        { id_playlist: '2', titre: 'Test2', prive: false },
        { id_playlist: '3', titre: 'Test3', prive: false },
      ];

      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ success: true }));

      const spyPlaylist = vi.spyOn(service, 'onChangeListPlaylist');
      const idPlaylist = '2';
      const isPrivate = true;
      service.switchVisibilityPlaylist(idPlaylist, isPrivate);

      const playlist = service.listPlaylist.find(a => a.id_playlist === idPlaylist);
      expect(playlist.prive).toEqual(isPrivate);
      expect(spyPlaylist).toHaveBeenCalled();
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

    it('should delete playlist and call onChangeListPlaylist on deletePlaylist', () => {
      service.listPlaylist = [
        { id_playlist: '1', titre: 'Test1', prive: false },
        { id_playlist: '2', titre: 'Test2', prive: false },
        { id_playlist: '3', titre: 'Test3', prive: false },
      ];

      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ success: true }));
      const spyPlaylist = vi.spyOn(service, 'onChangeListPlaylist');

      const idPlaylist = '2';
      service.deletePlaylist(idPlaylist);

      const playlist = service.listPlaylist.find(a => a.id_playlist === idPlaylist);
      expect(playlist).toBeUndefined();
      expect(spyPlaylist).toHaveBeenCalled();

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

    it('should add playlist to listFollow and call onChangeListFollow on switchFollow', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ success: true, est_suivi: true }));

      const spyFollow = vi.spyOn(service, 'onChangeListFollow');
      const idPlaylist = '2';
      const title = 'Test';
      const artist = 'Test Artist';
      const url_image = 'test.jpg';
      service.switchFollow(idPlaylist, title, artist, url_image);

      const follow = service.listFollow.find(a => a.id_playlist === idPlaylist);
      expect(follow).toEqual({ id_playlist: idPlaylist, titre: title, artiste: artist, url_image });

      expect(spyFollow).toHaveBeenCalled();
      expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should remove playlist from listFollow and call onChangeListFollow on switchFollow', () => {
      service.listFollow = [
        { id_playlist: '1', titre: 'Test1' },
        { id_playlist: '2', titre: 'Test2' },
        { id_playlist: '3', titre: 'Test3' },
      ];

      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(of({ success: true, est_suivi: false }));

      const spyFollow = vi.spyOn(service, 'onChangeListFollow');

      const idPlaylist = '2';
      service.switchFollow(idPlaylist);

      const follow = service.listFollow.find(a => a.id_playlist === idPlaylist);
      expect(follow).toBeUndefined();
      expect(spyFollow).toHaveBeenCalled();
    });

    it('should catch error on switchFollow', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'get').mockReturnValue(throwError('error'));

      const idPlaylist = '2';
      service.switchFollow(idPlaylist);

      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });

    it('should call subjectAddVideo.next on addVideoInPlaylist', () => {
      const spySubjectAddVideo = vi.spyOn(service.subjectAddVideo, 'next');

      const key = 'testKey';
      const artist = 'testArtist';
      const title = 'testTitle';
      const duration = 123;
      service.addVideoInPlaylist(key, artist, title, duration);

      expect(spySubjectAddVideo).toHaveBeenCalledWith({ key, artist, title, duration });
    });

    it('should call onChangeListPlaylist on successful addVideoInPlaylistRequest', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'post').mockReturnValue(of({ success: true }));

      const spyChangeList = vi.spyOn(service, 'onChangeListPlaylist');

      const idPlaylist = '2';
      const addKey = 'testKey';
      const addTitle = 'testTitle';
      const addArtist = 'testArtist';
      const addDuration = 123;
      service.addVideoInPlaylistRequest(idPlaylist, addKey, addTitle, addArtist, addDuration);

      expect(spyChangeList).toHaveBeenCalled();
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
      const spyChangePlaylist = vi.spyOn(service, 'onChangeCurrentPlaylist');

      const playlist = [{ key: '1' }, { key: '2' }, { key: '3' }] as Video[];
      service.addInCurrentList(playlist);

      expect(service.listVideo).toEqual(playlist);
      expect(service.tabIndexInitial).toEqual([0, 1, 2]);
      expect(service.tabIndex).toEqual([0, 1, 2]);
      expect(spyShuffle).not.toHaveBeenCalled();
      expect(spyChangePlaylist).toHaveBeenCalled();
    });

    it('should call shuffle on addInCurrentList when isRandom is true', () => {
      service.isRandom = true;
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
      const spyChangePlaylist = vi.spyOn(service, 'onChangeCurrentPlaylist');

      const video = { key: '1' } as Video;
      service.addVideoAfterCurrentInList(video);

      expect(service.listVideo).toEqual([video]);
      expect(service.tabIndexInitial).not.toEqual([]);
      expect(service.tabIndex).not.toEqual([]);
      expect(spyShuffle).not.toHaveBeenCalled();
      expect(spyChangePlaylist).toHaveBeenCalled();
    });

    it('should call shuffle on addVideoAfterCurrentInList when isRandom is true', () => {
      service.isRandom = true;

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

    it('should return true when key is in listLikeVideo on isLiked', () => {
      const key = '1';
      service.listLikeVideo = [{ key: '1' }, { key: '2' }] as UserVideo[];

      const result = service.isLiked(key);

      expect(result).toBe(true);
    });

    it('should return false when key is not in listLikeVideo on isLiked', () => {
      const key = '3';
      service.listLikeVideo = [{ key: '1' }, { key: '2' }] as UserVideo[];

      const result = service.isLiked(key);

      expect(result).not.toBe(true);
    });

    it('should add like to listLikeVideo on successful addLike', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'post').mockReturnValue(of({ success: true, like: { key: '1' } }));

      service.listLikeVideo = [];

      const key = '1';
      service.addLike(key);

      expect(service.listLikeVideo).toEqual([{ key: '1' } as UserVideo]);
      expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should call initService.onMessageUnlog on error addLike', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'post').mockReturnValue(throwError('error'));

      const key = '1';
      service.addLike(key);

      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });

    it('should remove like from listLikeVideo on successful removeLike', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'post').mockReturnValue(of({ success: true }));

      service.listLikeVideo = [{ key: '1' }, { key: '2' }] as UserVideo[];

      const key = '1';
      service.removeLike(key);

      expect(service.listLikeVideo).toEqual([{ key: '2' } as UserVideo]);
      expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should call initService.onMessageUnlog on error removeLike', () => {
      const httpClient = TestBed.inject(HttpClient);
      vi.spyOn(httpClient, 'post').mockReturnValue(throwError('error'));

      const key = '1';
      service.removeLike(key);

      expect(initService.onMessageUnlog).toHaveBeenCalled();
    });

    it('should insert YouTube iframe API script into the DOM', () => {
      // Count existing script tags and calls before test
      const initialScriptCount = document.getElementsByTagName('script').length;

      const createElementSpy = vi.spyOn(document, 'createElement');
      const getElementsByTagNameSpy = vi.spyOn(document, 'getElementsByTagName');

      // Get the first script's parent before calling init
      const firstScript = document.getElementsByTagName('script')[0];
      const insertBeforeSpy = vi.spyOn(firstScript.parentNode!, 'insertBefore');

      service['init']();

      // Verify methods were called during init() execution
      expect(createElementSpy).toHaveBeenCalledWith('script');
      expect(getElementsByTagNameSpy).toHaveBeenCalledWith('script');
      expect(insertBeforeSpy).toHaveBeenCalled();

      // Verify a new script was actually added
      expect(document.getElementsByTagName('script').length).toBe(initialScriptCount + 1);
    });

    it('should call init using requestIdleCallback if available', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).requestIdleCallback = (callback: () => void) => callback();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initSpy = vi.spyOn(service as any, 'init');
      service['init']();

      expect(initSpy).toHaveBeenCalled();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).requestIdleCallback;
    });

    it('should send "error_invalid_parameter" message when error data is 2', () => {
      const errorMessageSpy = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).errorMessageSubject.subscribe(errorMessageSpy);

      const errorEvent = { data: 2 };
      service.onErrorYT(errorEvent);

      expect(errorMessageSpy).toHaveBeenCalledWith('error_invalid_parameter');
    });

    it('should send "error_html_player" message when error data is 5', () => {
      const errorMessageSpy = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).errorMessageSubject.subscribe(errorMessageSpy);

      const errorEvent = { data: 5 };
      service.onErrorYT(errorEvent);

      expect(errorMessageSpy).toHaveBeenCalledWith('error_html_player');
    });

    it('should send "error_request_not_found" message when error data is 100', () => {
      const errorMessageSpy = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).errorMessageSubject.subscribe(errorMessageSpy);

      const errorEvent = { data: 100 };
      service.onErrorYT(errorEvent);

      expect(errorMessageSpy).toHaveBeenCalledWith('error_request_not_found');
    });

    it('should send "error_request_access_denied" message when error data is 101', () => {
      const errorMessageSpy = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).errorMessageSubject.subscribe(errorMessageSpy);

      const errorEvent = { data: 101 };
      service.onErrorYT(errorEvent);

      expect(errorMessageSpy).toHaveBeenCalledWith('error_request_access_denied');
    });

    it('should send "error_request_access_denied" message when error data is 150', () => {
      const errorMessageSpy = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).errorMessageSubject.subscribe(errorMessageSpy);

      const errorEvent = { data: 150 };
      service.onErrorYT(errorEvent);

      expect(errorMessageSpy).toHaveBeenCalledWith('error_request_access_denied');
    });

    it('should send "error_unknown" message when error data is not recognized', () => {
      const errorMessageSpy = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).errorMessageSubject.subscribe(errorMessageSpy);

      const errorEvent = { data: 99 };
      service.onErrorYT(errorEvent);

      expect(errorMessageSpy).toHaveBeenCalledWith('error_unknown');
    });

    it('should handle edge case when error data is a non-numeric value', () => {
      const errorMessageSpy = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).errorMessageSubject.subscribe(errorMessageSpy);

      const errorEvent = { data: 'not-a-number' } as unknown as { data: number };
      service.onErrorYT(errorEvent);

      expect(errorMessageSpy).toHaveBeenCalledWith('error_unknown');
    });
  });

  describe('In server environment', () => {
    let service: PlayerService;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let titleService: Title;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let initService: InitService;
    let translocoService: TranslocoService;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initServiceMock: any = { init: vi.fn(), onMessageUnlog: vi.fn() };
      initServiceMock.subjectInitializePlaylist = new BehaviorSubject({
        listPlaylist: [],
        listFollow: [],
        listVideo: [
          {
            id_video: '123',
            artiste: 'Test Artist',
            artists: [{ id_artiste: '123', label: 'Test Artist' }],
            duree: '100',
            id_playlist: '123',
            key: 'XXX',
            ordre: '1',
            titre: 'Test Video',
            titre_album: 'Test Album',
          },
        ],
        tabIndex: [0],
        listLikeVideo: [],
      });
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

      const mockPlayer = {
        loadVideoById: vi.fn(),
        setVolume: vi.fn(),
        seekTo: vi.fn(),
        getDuration: () => 100,
        getCurrentTime: () => 50,
        getVideoLoadedFraction: () => 0.5,
        getVolume: () => 50,
        playVideo: vi.fn(),
        getPlayerState: () => 2,
        pauseVideo: vi.fn(),
        cueVideoById: vi.fn(),
      };
      service.player = mockPlayer;
    });

    it('should not manipulate DOM in init method when in server context', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).init();

      // In server context, isBrowser should be false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).isBrowser).toBe(false);

      // The init method should not add new YouTube scripts
      // (setup-vitest may have created scripts, so we don't check that)
    });

    it('should not initialize YouTube API when in server context', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).isBrowser).toBe(false);

      service.launchYTApi();

      // In server context, YT should remain undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).YT).toBeUndefined();
    });
  });
});
