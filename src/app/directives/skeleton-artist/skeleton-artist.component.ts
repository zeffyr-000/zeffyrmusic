import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Skeleton loader for artist profile page (avatar + info + album grid). */
@Component({
  selector: 'app-skeleton-artist',
  templateUrl: './skeleton-artist.component.html',
  styleUrl: './skeleton-artist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonArtistComponent {
  /** Number of placeholder album cards to show */
  readonly count = input(6);

  get items(): number[] {
    return Array.from({ length: this.count() });
  }
}
