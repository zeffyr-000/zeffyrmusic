import { Component, OnDestroy, OnInit } from '@angular/core';
import { FollowItem } from '../models/follow.model';
import { Subscription } from 'rxjs';
import { PlayerService } from '../services/player.service';
import { Title } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DefaultImageDirective } from '../directives/default-image.directive';

@Component({
    selector: 'app-my-selection',
    templateUrl: './my-selection.component.html',
    styleUrl: './my-selection.component.css',
    imports: [NgFor, RouterLink, DefaultImageDirective, TranslocoPipe]
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
