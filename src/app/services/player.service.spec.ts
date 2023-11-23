import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { InitService } from './init.service';
import { PlayerService } from './player.service';
import { TranslocoTestingModule, TranslocoConfig, TRANSLOCO_CONFIG, TranslocoService } from '@ngneat/transloco';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { UserVideo, Video } from '../models/video.model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { UserPlaylist } from '../models/playlist.model';
import { FollowItem } from '../models/follow.model';

describe('PlayerService', () => {
    let service: PlayerService;
    let titleService: Title;
    let initService: InitService;
    let translocoService: TranslocoService;

    beforeEach(async () => {
        const initServiceMock = jasmine.createSpyObj('InitService', ['init', 'onMessageUnlog']);
        initServiceMock.subjectInitializePlaylist = new BehaviorSubject({
            listPlaylist: [],
            listFollow: [],
            listVideo: [{
                id_video: '123',
                artiste: 'Test Artist',
                artists: [{ id_artiste: '123', label: 'Test Artist' }],
                duree: '100',
                id_playlist: '123',
                key: 'XXX',
                ordre: '1',
                titre: 'Test Video',
                titre_album: 'Test Album',
            }],
            tabIndex: [0],
            listLikeVideo: [],
        });

        await TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                TranslocoTestingModule.forRoot({
                    langs: { en: { meta_description: 'META_DESCRIPTION', title: 'TITLE' }, fr: { meta_description: 'META_DESCRIPTION_FR', title: 'TITLE_FR' } }
                })
            ],
            providers: [
                {
                    provide: Title,
                    useValue: {
                        setTitle: () => { },
                    },
                },
                {
                    provide: InitService,
                    useValue: initServiceMock,
                },
                PlayerService,
                {
                    provide: TRANSLOCO_CONFIG, useValue: {
                        reRenderOnLangChange: true,
                        availableLangs: ['en', 'fr'],
                        defaultLang: 'en',
                        prodMode: false,
                    } as TranslocoConfig
                },],
        }).compileComponents();
        service = TestBed.inject(PlayerService);
        titleService = TestBed.inject(Title);
        initService = TestBed.inject(InitService);
        translocoService = TestBed.inject(TranslocoService);
        translocoService.setDefaultLang('en');

        const mockPlayer = {
            loadVideoById: jasmine.createSpy('loadVideoById'),
            setVolume: jasmine.createSpy('setVolume'),
            seekTo: jasmine.createSpy('seekTo'),
            getDuration: () => 100,
            getCurrentTime: () => 50,
            getVideoLoadedFraction: () => 0.5,
            getVolume: () => 50,
            playVideo: jasmine.createSpy('playVideo'),
            getPlayerState: () => 2,
            pauseVideo: jasmine.createSpy('pauseVideo'),
            cueVideoById: jasmine.createSpy('cueVideoById'),
        };
        service.player = mockPlayer;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set the title on lecture', () => {
        spyOn(titleService, 'setTitle');
        service.listVideo = [
            {
                id_video: '123',
                artiste: 'Test Artist',
                artists: [{ id_artiste: '123', label: 'Test Artist' }],
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
                artists: [{ id_artiste: '123', label: 'Test Artist' }],
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
        const spy = spyOn(service.subjectVolumeChange, 'next');
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
                artists: [{ id_artiste: '123', label: 'Test Artist' }],
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
                artists: [{ id_artiste: '456', label: 'Test Artist 2' }],
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
                artists: [{ id_artiste: '456', label: 'Test Artist 2' }],
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
        const spy = spyOn(Math, 'random').and.returnValues(0.5, 0.2, 0.8, 0.1, 0.3);
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

        const spyShuffle = spyOn(service, 'shuffle');

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

        const spyShuffle = spyOn(service, 'shuffle');

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
        spyOn(service.subjectRepeatChange, 'next');

        service.switchRepeat();

        expect(service.isRepeat).toBe(true);
        expect(service.subjectRepeatChange.next).toHaveBeenCalledWith(true);
    });

    it('should switch isRandom and emit new value on switchRandom', () => {
        service.isRandom = false;
        spyOn(service.subjectRandomChange, 'next');

        service.switchRandom();

        expect(service.isRandom).toBe(true);
        expect(service.subjectRandomChange.next).toHaveBeenCalledWith(true);
    });

    it('should remove video and call callback on removeVideo', () => {
        service.listVideo = [
            {
                id_video: '1',
                artiste: 'Test Artist',
                artists: [{ id_artiste: '1', label: 'Test Artist' }],
                duree: '100',
                id_playlist: '1',
                key: 'XXX-XXX',
                ordre: '1',
                titre: 'Test Video',
            },
            {
                id_video: '2',
                artiste: 'Test Artist 2',
                artists: [{ id_artiste: '2', label: 'Test Artist 2' }],
                duree: '100',
                id_playlist: '2',
                key: 'YYY-YYY',
                ordre: '1',
                titre: 'Test Video 2',
            },
            {
                id_video: '3',
                artiste: 'Test Artist 3',
                artists: [{ id_artiste: '3', label: 'Test Artist 3' }],
                duree: '100',
                id_playlist: '3',
                key: 'ZZZ-ZZZ',
                ordre: '1',
                titre: 'Test Video 3',
            }
        ] as Video[];

        const httpClient = TestBed.inject(HttpClient);
        const httpClientSpy = spyOn(httpClient, 'get').and.returnValue(of({ success: true }));

        const callbackSuccess = jasmine.createSpy('callbackSuccess');

        service.removeVideo('2', callbackSuccess);

        expect(httpClientSpy).toHaveBeenCalledWith(
            environment.URL_SERVER + 'supprimer/' + '2',
            environment.httpClientConfig
        );
        expect(service.listVideo.length).toBe(2);
        expect(callbackSuccess).toHaveBeenCalled();
    });

    it('should catch error on removeVideo', () => {
        service.listVideo = [
            {
                id_video: '1',
                artiste: 'Test Artist',
                artists: [{ id_artiste: '1', label: 'Test Artist' }],
                duree: '100',
                id_playlist: '1',
                key: 'XXX-XXX',
                ordre: '1',
                titre: 'Test Video',
            },
            {
                id_video: '2',
                artiste: 'Test Artist 2',
                artists: [{ id_artiste: '2', label: 'Test Artist 2' }],
                duree: '100',
                id_playlist: '2',
                key: 'YYY-YYY',
                ordre: '1',
                titre: 'Test Video 2',
            },
            {
                id_video: '3',
                artiste: 'Test Artist 3',
                artists: [{ id_artiste: '3', label: 'Test Artist 3' }],
                duree: '100',
                id_playlist: '3',
                key: 'ZZZ-ZZZ',
                ordre: '1',
                titre: 'Test Video 3',
            }
        ] as Video[];

        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'get').and.returnValue(throwError('error'));

        const callbackSuccess = jasmine.createSpy('callbackSuccess');

        service.removeVideo('2', callbackSuccess);

        expect(initService.onMessageUnlog).toHaveBeenCalled();
        expect(callbackSuccess).not.toHaveBeenCalled();
    });

    it('should set the title and artist to empty string if not provided on lecture', () => {
        service.listVideo = [
            {
                id_video: '123',
                artiste: 'Test Artist',
                artists: [{ id_artiste: '123', label: 'Test Artist' }],
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
                artists: [{ id_artiste: '123', label: 'Test Artist' }],
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
                artists: [{ id_artiste: '456', label: 'Test Artist 2' }],
                duree: '100',
                id_playlist: '456',
                key: 'YYY-456',
                ordre: '1',
                titre: 'Test Video 2',
                titre_album: 'Test Album 2',
            },
            {
                id_video: '789',
                artiste: 'Test Artist 3',
                artists: [{ id_artiste: '789', label: 'Test Artist 3' }],
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
    });

    it('should call launchFullInit on first play if not autoplay', () => {
        service.isAutoPlay = false;
        const spy = spyOn(service, 'launchFullInit');
        service.firstLaunched = false;
        service.finvideo({ data: 1 });
        expect(spy).toHaveBeenCalled();
    });

    it('should call testAutoPlay on first play if autoplay', () => {
        service.isAutoPlay = true;
        const spy = spyOn(service, 'testAutoPlay');
        service.firstLaunched = false;
        service.finvideo({ data: 1 });
        expect(spy).toHaveBeenCalled();
    });

    it('should not call launchFullInit on subsequent plays', () => {
        service.isAutoPlay = false;
        const spy = spyOn(service, 'launchFullInit');
        service.firstLaunched = true;
        service.finvideo({ data: 1 });
        expect(spy).not.toHaveBeenCalled();
    });

    it('should not call testAutoPlay on subsequent plays', () => {
        service.isAutoPlay = true;
        const spy = spyOn(service, 'testAutoPlay');
        service.firstLaunched = true;
        service.finvideo({ data: 1 });
        expect(spy).not.toHaveBeenCalled();
    });

    it('should disable full init on play if showTapVideoYT is true', () => {
        service.showTapVideoYT = true;
        const spy = spyOn(service, 'disableFullInit');
        service.finvideo({ data: 1 });
        expect(spy).toHaveBeenCalled();
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

    it('should set refInterval to null on video end', () => {
        service.refInterval = 123;
        service.finvideo({ data: 2 });
        expect(service.refInterval).toBe(null);
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
        const spy = spyOn(service, 'lecture');
        service.tabIndex = [0, 1, 2];
        service.currentIndex = 1;
        service.before();
        expect(spy).toHaveBeenCalledWith(0);
    });

    it('should call lecture on after', () => {
        const spy = spyOn(service, 'lecture');
        service.tabIndex = [0, 1, 2];
        service.currentIndex = 1;
        service.after();
        expect(spy).toHaveBeenCalledWith(2);
    });

    it('should call lecture with 0 on after when isRepeat is true and tabIndex[currentIndex + 1] is undefined', () => {
        service.isRepeat = true;
        service.tabIndex = [1];
        service.currentIndex = 0;

        const spyLecture = spyOn(service, 'lecture');

        service.after();

        expect(spyLecture).toHaveBeenCalledWith(0);
    });

    it('should call lecture with indexInitial on lecture', () => {
        const spy = spyOn(service, 'lecture');
        service.listVideo = [
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
        ];
        service.lecture(0, true);
        expect(spy).toHaveBeenCalledWith(0, true);
        expect(service.currentIndex).toBe(0);
    });

    it('should call player.playVideo on onPlayPause if paused', () => {
        service.isPlaying = false;
        service.firstLaunched = true;

        service.onPlayPause();
        expect(service.player.playVideo).toHaveBeenCalled();
        expect(service.isPlaying).toBe(true);
    });

    it('should call player.pauseVideo on onPlayPause if playing', () => {
        service.isPlaying = true;
        service.firstLaunched = true;
        service.player.getPlayerState = () => 1;

        service.onPlayPause();
        expect(service.player.pauseVideo).toHaveBeenCalled();
        expect(service.isPlaying).toBe(false);
    });

    it('should call lecture on onPlayPause if not firstLaunched', () => {
        const spy = spyOn(service, 'lecture');
        service.isPlaying = false;
        service.firstLaunched = false;
        service.onPlayPause();
        expect(spy).toHaveBeenCalledWith(0);
    });

    it('should not call launchFullInit on testAutoPlay if firstLaunched', () => {
        const spy = spyOn(service, 'launchFullInit');
        service.firstLaunched = true;
        service.testAutoPlay();
        expect(spy).not.toHaveBeenCalled();
    });

    it('should unsubscribe from subscriptionInitializePlaylist on ngOnDestroy', () => {
        const spy = spyOn(service.subscriptionInitializePlaylist, 'unsubscribe');
        service.ngOnDestroy();
        expect(spy).toHaveBeenCalled();
    });

    it('should load lists and call onChange methods on onLoadListLogin', () => {
        const spyPlaylist = spyOn(service, 'onChangeListPlaylist');
        const spyFollow = spyOn(service, 'onChangeListFollow');

        const listPlaylist: UserPlaylist[] = [{ id_playlist: '1', titre: 'Test', prive: false }];
        const listFollow: FollowItem[] = [{ id_playlist: '1', titre: 'Test' }];
        service.onLoadListLogin(listPlaylist, listFollow);

        expect(service.listPlaylist).toEqual(listPlaylist);
        expect(service.listFollow).toEqual(listFollow);
        expect(spyPlaylist).toHaveBeenCalled();
        expect(spyFollow).toHaveBeenCalled();
    });

    it('should add new playlist and call onChangeListPlaylist on addNewPlaylist', () => {
        const spy = spyOn(service, 'onChangeListPlaylist');

        const idPlaylist = '1';
        const title = 'Test';
        service.addNewPlaylist(idPlaylist, title);

        expect(service.listPlaylist[0]).toEqual({ id_playlist: idPlaylist, titre: title, prive: false });
        expect(spy).toHaveBeenCalled();
    });

    it('should edit playlist title and call onChangeListPlaylist on editPlaylistTitle', () => {
        service.listPlaylist = [
            { id_playlist: '1', titre: 'Test1', prive: false },
            { id_playlist: '2', titre: 'Test2', prive: false },
            { id_playlist: '3', titre: 'Test3', prive: false }
        ];

        const spy = spyOn(service, 'onChangeListPlaylist');
        const idPlaylist = '2';
        const newTitle = 'New Test';
        service.editPlaylistTitle(idPlaylist, newTitle);

        const playlist = service.listPlaylist.find(a => a.id_playlist === idPlaylist);
        expect(playlist.titre).toEqual(newTitle);
        expect(spy).toHaveBeenCalled();
    });

    it('should update player running on playerRunning', () => {
        const spyCurrentTime = spyOn(service.player, 'getCurrentTime').and.returnValue(120);
        const spyDuration = spyOn(service.player, 'getDuration').and.returnValue(300);
        const spyLoadedFraction = spyOn(service.player, 'getVideoLoadedFraction').and.returnValue(0.5);

        const spyNext = spyOn(service.subjectPlayerRunningChange, 'next');

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
            { id_playlist: '3', titre: 'Test3', prive: false }
        ];

        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'get').and.returnValue(of({ success: true }));

        const spyPlaylist = spyOn(service, 'onChangeListPlaylist');
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
        spyOn(httpClient, 'get').and.returnValue(throwError('error'));

        const idPlaylist = '2';
        const isPrivate = true;
        service.switchVisibilityPlaylist(idPlaylist, isPrivate);

        expect(initService.onMessageUnlog).toHaveBeenCalled();
    });

    it('should delete playlist and call onChangeListPlaylist on deletePlaylist', () => {
        service.listPlaylist = [
            { id_playlist: '1', titre: 'Test1', prive: false },
            { id_playlist: '2', titre: 'Test2', prive: false },
            { id_playlist: '3', titre: 'Test3', prive: false }
        ];

        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'get').and.returnValue(of({ success: true }));
        const spyPlaylist = spyOn(service, 'onChangeListPlaylist');

        const idPlaylist = '2';
        service.deletePlaylist(idPlaylist);

        const playlist = service.listPlaylist.find(a => a.id_playlist === idPlaylist);
        expect(playlist).toBeUndefined();
        expect(spyPlaylist).toHaveBeenCalled();

        expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should catch error on deletePlaylist', () => {
        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'get').and.returnValue(throwError('error'));

        const idPlaylist = '2';
        service.deletePlaylist(idPlaylist);

        expect(initService.onMessageUnlog).toHaveBeenCalled();
    });

    it('should call switchFollow on deleteFollow', () => {
        const spySwitchFollow = spyOn(service, 'switchFollow');

        const idPlaylist = '2';
        service.deleteFollow(idPlaylist);

        expect(spySwitchFollow).toHaveBeenCalledWith(idPlaylist);
    });

    it('should add playlist to listFollow and call onChangeListFollow on switchFollow', () => {
        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'get').and.returnValue(of({ success: true, est_suivi: true }));

        const spyFollow = spyOn(service, 'onChangeListFollow');
        const idPlaylist = '2';
        const title = 'Test';
        service.switchFollow(idPlaylist, title);

        const follow = service.listFollow.find(a => a.id_playlist === idPlaylist);
        expect(follow).toEqual({ id_playlist: idPlaylist, titre: title });

        expect(spyFollow).toHaveBeenCalled();
        expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should remove playlist from listFollow and call onChangeListFollow on switchFollow', () => {
        service.listFollow = [
            { id_playlist: '1', titre: 'Test1' },
            { id_playlist: '2', titre: 'Test2' },
            { id_playlist: '3', titre: 'Test3' }
        ];

        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'get').and.returnValue(of({ success: true, est_suivi: false }));

        const spyFollow = spyOn(service, 'onChangeListFollow');

        const idPlaylist = '2';
        service.switchFollow(idPlaylist);

        const follow = service.listFollow.find(a => a.id_playlist === idPlaylist);
        expect(follow).toBeUndefined();
        expect(spyFollow).toHaveBeenCalled();
    });

    it('should catch error on switchFollow', () => {
        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'get').and.returnValue(throwError('error'));

        const idPlaylist = '2';
        service.switchFollow(idPlaylist);

        expect(initService.onMessageUnlog).toHaveBeenCalled();
    });

    it('should call subjectAddVideo.next on addVideoInPlaylist', () => {
        const spySubjectAddVideo = spyOn(service.subjectAddVideo, 'next');

        const key = 'testKey';
        const artist = 'testArtist';
        const title = 'testTitle';
        const duration = 123;
        service.addVideoInPlaylist(key, artist, title, duration);

        expect(spySubjectAddVideo).toHaveBeenCalledWith({ key, artist, title, duration });
    });

    it('should call onChangeListPlaylist on successful addVideoInPlaylistRequest', () => {
        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'post').and.returnValue(of({ success: true }));

        const spyChangeList = spyOn(service, 'onChangeListPlaylist');

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
        spyOn(httpClient, 'post').and.returnValue(throwError('error'));

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

        const spyShuffle = spyOn(service, 'shuffle');
        const spyChangePlaylist = spyOn(service, 'onChangeCurrentPlaylist');

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
        const spyShuffle = spyOn(service, 'shuffle');
        const playlist = [{ key: '1' }, { key: '2' }, { key: '3' }] as Video[];
        service.addInCurrentList(playlist);

        expect(spyShuffle).toHaveBeenCalled();
    });

    it('should add video to listVideo and update tabIndexInitial, tabIndex on addVideoAfterCurrentInList', () => {
        service.listVideo = [];
        service.tabIndexInitial = [];
        service.tabIndex = [];
        service.currentIndex = 0;

        const spyShuffle = spyOn(service, 'shuffle');
        const spyChangePlaylist = spyOn(service, 'onChangeCurrentPlaylist');

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

        const spyShuffle = spyOn(service, 'shuffle');

        const video = { key: '1' } as Video;
        service.addVideoAfterCurrentInList(video);

        expect(spyShuffle).toHaveBeenCalled();
    });

    it('should reset listVideo, tabIndexInitial, tabIndex, call addInCurrentList and lecture on runPlaylist', () => {
        service.listVideo = [{ key: '1' }] as Video[];
        service.tabIndexInitial = [1];
        service.tabIndex = [1];

        const spyAddInCurrentList = spyOn(service, 'addInCurrentList');
        const spyLecture = spyOn(service, 'lecture');

        const playlist = [{ key: '2' }, { key: '3' }] as Video[];
        const index = 1;
        service.runPlaylist(playlist, index);

        expect(service.listVideo).toEqual([]);
        expect(service.tabIndexInitial).toEqual([]);
        expect(service.tabIndex).toEqual([]);
        expect(spyAddInCurrentList).toHaveBeenCalledWith(playlist);
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
        spyOn(httpClient, 'post').and.returnValue(of({ success: true, like: { key: '1' } }));

        service.listLikeVideo = [];

        const key = '1';
        service.addLike(key);

        expect(service.listLikeVideo).toEqual([{ key: '1' } as UserVideo]);
        expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should call initService.onMessageUnlog on error addLike', () => {
        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'post').and.returnValue(throwError('error'));

        const key = '1';
        service.addLike(key);

        expect(initService.onMessageUnlog).toHaveBeenCalled();
    });

    it('should remove like from listLikeVideo on successful removeLike', () => {
        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'post').and.returnValue(of({ success: true }));

        service.listLikeVideo = [{ key: '1' }, { key: '2' }] as UserVideo[];

        const key = '1';
        service.removeLike(key);

        expect(service.listLikeVideo).toEqual([{ key: '2' } as UserVideo]);
        expect(initService.onMessageUnlog).not.toHaveBeenCalled();
    });

    it('should call initService.onMessageUnlog on error removeLike', () => {
        const httpClient = TestBed.inject(HttpClient);
        spyOn(httpClient, 'post').and.returnValue(throwError('error'));

        const key = '1';
        service.removeLike(key);

        expect(initService.onMessageUnlog).toHaveBeenCalled();
    });
});