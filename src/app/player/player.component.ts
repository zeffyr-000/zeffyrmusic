import { Component, OnDestroy, NgZone, ViewChild, AfterViewInit, inject } from '@angular/core';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { Subscription } from 'rxjs';
import { Video } from '../models/video.model';
import { YouTubePlayer } from '@angular/youtube-player';
import { LazyLoadImageDirective } from '../directives/lazy-load-image.directive';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  imports: [
    YouTubePlayer,
    LazyLoadImageDirective,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    TranslocoPipe,
  ],
})
export class PlayerComponent implements OnDestroy, AfterViewInit {
  private readonly initService = inject(InitService);
  private readonly playerService = inject(PlayerService);
  private readonly ngZone = inject(NgZone);

  @ViewChild('youtubePlayer') youtubePlayer: YouTubePlayer;
  isConnected = false;
  list: Video[];
  currentKey: string;

  subscription: Subscription;
  subscriptionChangeKey: Subscription;
  subscriptionConnected: Subscription;

  constructor() {
    const playerService = this.playerService;

    this.subscription = playerService.subjectCurrentPlaylistChange?.subscribe(list => {
      this.list = list;
    });

    this.subscriptionChangeKey = this.playerService.subjectCurrentKeyChange?.subscribe(data => {
      this.ngZone.run(() => {
        this.currentKey = data.currentKey;
      });
    });

    this.subscriptionConnected = this.initService.subjectConnectedChange?.subscribe(data => {
      this.isConnected = data.isConnected;
    });
  }

  ngAfterViewInit() {
    this.playerService.launchYTApi();
  }

  play(index: number, isInitialIndex: boolean) {
    this.playerService.lecture(index, isInitialIndex);
  }

  removeToPlaylist(index: number) {
    this.playerService.removeToPlaylist(index);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.subscriptionChangeKey.unsubscribe();
    this.subscriptionConnected.unsubscribe();
  }
}
