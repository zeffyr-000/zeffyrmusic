import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FollowItem } from '../models/follow.model';
import { Subscription } from 'rxjs';
import { PlayerService } from '../services/player.service';
import { Title } from '@angular/platform-browser';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { DefaultImageDirective } from '../directives/default-image.directive';

@Component({
  selector: 'app-my-selection',
  templateUrl: './my-selection.component.html',
  styleUrl: './my-selection.component.css',
  imports: [RouterLink, DefaultImageDirective, TranslocoPipe],
})
export class MySelectionComponent implements OnInit, OnDestroy {
  playerService = inject(PlayerService);
  private titleService = inject(Title);
  private readonly translocoService = inject(TranslocoService);

  listFollow: FollowItem[];
  subscriptionListFollow: Subscription;

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
