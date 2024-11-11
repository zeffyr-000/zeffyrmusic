import { Component, OnDestroy, OnInit } from '@angular/core';
import { FollowItem } from '../models/follow.model';
import { Subscription } from 'rxjs';
import { PlayerService } from '../services/player.service';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-my-selection',
  templateUrl: './my-selection.component.html',
  styleUrl: './my-selection.component.css'
})
export class MySelectionComponent implements OnInit, OnDestroy {
  listFollow: FollowItem[];
  subscriptionListFollow: Subscription;

  constructor(
    public playerService: PlayerService,
    private titleService: Title,
    private readonly translocoService: TranslocoService,
  ) { }

  ngOnInit() {
    this.titleService.setTitle(this.translocoService.translate('ma_selection') + ' - Zeffyr Music');

    this.subscriptionListFollow = this.playerService.subjectListFollow.subscribe(data => {
      this.listFollow = data;
    });
  }

  onDeleteFollow(idPlaylist: string) {
    this.playerService.deleteFollow(idPlaylist);
  }

  ngOnDestroy() {
    this.subscriptionListFollow.unsubscribe();
  }
}
