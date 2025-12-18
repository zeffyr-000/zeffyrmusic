import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Video } from '../models/video.model';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';
import { LazyLoadImageDirective } from '../directives/lazy-load-image.directive';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-current',
  templateUrl: './current.component.html',
  styleUrl: './current.component.css',
  imports: [
    LazyLoadImageDirective,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    TranslocoPipe,
  ],
})
export class CurrentComponent implements OnInit, OnDestroy {
  private readonly playerService = inject(PlayerService);
  private readonly initService = inject(InitService);
  private readonly ngZone = inject(NgZone);

  isConnected = false;
  list: Video[];
  currentKey: string;

  subscription: Subscription;
  subscriptionChangeKey: Subscription;
  subscriptionConnected: Subscription;

  ngOnInit() {
    this.list = this.playerService.subjectCurrentPlaylistChange?.getValue();
    this.subscription = this.playerService.subjectCurrentPlaylistChange?.subscribe(list => {
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
