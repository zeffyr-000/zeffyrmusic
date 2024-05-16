import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Video } from '../models/video.model';
import { InitService } from '../services/init.service';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-current',
  templateUrl: './current.component.html',
  styleUrl: './current.component.css'
})
export class CurrentComponent implements OnInit, OnDestroy {

  isConnected = false;
  list: Video[];
  currentKey: string;

  subscription: Subscription;
  subscriptionChangeKey: Subscription;
  subscriptionConnected: Subscription;

  constructor(private readonly playerService: PlayerService,
    private readonly initService: InitService,
    private readonly ngZone: NgZone) { }

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
