import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { BehaviorSubject } from 'rxjs';
import { Video } from '../models/video.model';
import { PlayerComponent } from './player.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('PlayerComponent', () => {
  let component: PlayerComponent;
  let fixture: ComponentFixture<PlayerComponent>;
  let initService: InitService;
  let playerService: PlayerService;

  beforeEach(async () => {
    const initServiceMock = jasmine.createSpyObj('InitService', ['init']);
    const playerServiceMock = jasmine.createSpyObj('PlayerService', [
      'launchYTApi',
      'lecture',
      'removeToPlaylist'
    ]);
    playerServiceMock.subjectCurrentPlaylistChange = new BehaviorSubject([]);
    playerServiceMock.subjectCurrentKeyChange = new BehaviorSubject({ currentKey: 'test-key', currentTitle: 'test-title', currentArtist: 'test-artist' });
    initServiceMock.subjectConnectedChange = new BehaviorSubject({ isConnected: true, pseudo: 'test-pseudo', idPerso: 'test-idPerso', mail: 'test-mail' });

    await TestBed.configureTestingModule({
      declarations: [PlayerComponent],
      providers: [
        {
          provide: InitService,
          useValue: initServiceMock,
        },
        {
          provide: PlayerService,
          useValue: playerServiceMock,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerComponent);
    component = fixture.componentInstance;
    initService = TestBed.inject(InitService);
    playerService = TestBed.inject(PlayerService);
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set list on playlist change', () => {
    const list: Video[] = [{
      id_video: '1',
      artiste: 'Artiste 1',
      artists: [{ id_artiste: '1', label: 'Artiste 1' }],
      duree: '100',
      id_playlist: '1',
      key: 'XXX-XXX',
      ordre: '1',
      titre: 'Titre 1',
      titre_album: 'Titre album 1'
    }];
    playerService.subjectCurrentPlaylistChange.next(list);
    expect(component.list).toEqual(list);
  });

  it('should set currentKey on current key change', () => {
    const data = { currentKey: 'test-key', currentTitle: 'test-title', currentArtist: 'test-artist' };
    playerService.subjectCurrentKeyChange.next(data);
    expect(component.currentKey).toEqual(data.currentKey);
  });

  it('should set isConnected on connected change', () => {
    const data = { isConnected: true, pseudo: 'test-pseudo', idPerso: 'test-idPerso', mail: 'test-mail' };
    initService.subjectConnectedChange.next(data);
    expect(component.isConnected).toEqual(data.isConnected);
  });

  it('should call launchYTApi on init', () => {
    component.ngOnInit();
    expect(playerService.launchYTApi).toHaveBeenCalled();
  });

  it('should call lecture on play', () => {
    component.play(0, true);
    expect(playerService.lecture).toHaveBeenCalledWith(0, true);
  });

  it('should call removeToPlaylist on removeToPlaylist', () => {
    component.removeToPlaylist(0);
    expect(playerService.removeToPlaylist).toHaveBeenCalledWith(0);
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component.subscription, 'unsubscribe');
    spyOn(component.subscriptionChangeKey, 'unsubscribe');
    spyOn(component.subscriptionConnected, 'unsubscribe');
    component.ngOnDestroy();
    expect(component.subscription.unsubscribe).toHaveBeenCalled();
    expect(component.subscriptionChangeKey.unsubscribe).toHaveBeenCalled();
    expect(component.subscriptionConnected.unsubscribe).toHaveBeenCalled();
  });
});