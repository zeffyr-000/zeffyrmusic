import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PlayerService } from '../services/player.service';
import { LazyLoadImageDirective } from '../directives/lazy-load-image.directive';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';
import { QueueStore, AuthStore } from '../store';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LazyLoadImageDirective,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    TranslocoPipe,
  ],
})
export class PlayerComponent {
  readonly playerService = inject(PlayerService);
  readonly queueStore = inject(QueueStore);
  readonly authStore = inject(AuthStore);

  play(index: number, isInitialIndex: boolean) {
    this.playerService.lecture(index, isInitialIndex);
  }

  removeToPlaylist(index: number) {
    this.playerService.removeToPlaylist(index);
  }
}
