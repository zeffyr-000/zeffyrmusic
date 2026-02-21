import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Skeleton loader for track list layouts (playlist, search tracks). */
@Component({
  selector: 'app-skeleton-list',
  templateUrl: './skeleton-list.component.html',
  styleUrl: './skeleton-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonListComponent {
  /** Number of placeholder tracks to show */
  readonly count = input(8);

  get items(): number[] {
    return Array.from({ length: this.count() });
  }
}
