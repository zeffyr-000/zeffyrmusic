import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Skeleton loader for playlist page (header with image/info + track list). */
@Component({
  selector: 'app-skeleton-playlist',
  templateUrl: './skeleton-playlist.component.html',
  styleUrl: './skeleton-playlist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonPlaylistComponent {
  /** Number of placeholder tracks to show */
  readonly count = input(8);

  get items(): number[] {
    return Array.from({ length: this.count() });
  }
}
