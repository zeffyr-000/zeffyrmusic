import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Skeleton loader for card grid layouts (home, search albums/artists). */
@Component({
  selector: 'app-skeleton-card',
  templateUrl: './skeleton-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonCardComponent {
  /** Number of placeholder cards to show */
  readonly count = input(6);

  get items(): number[] {
    return Array.from({ length: this.count() });
  }
}
