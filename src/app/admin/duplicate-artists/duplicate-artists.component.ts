import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AbstractDuplicatePage } from '../abstract-duplicate-page';
import { AdminListShellComponent } from '../admin-list-shell/admin-list-shell.component';
import {
  DuplicateMergeControlsComponent,
  MergeCandidate,
} from '../duplicate-merge-controls/duplicate-merge-controls.component';
import { ArtistAdminService } from '../../services/artist-admin.service';
import { DuplicateArtistGroup } from '../../models/artist-admin.model';

@Component({
  selector: 'app-duplicate-artists',
  templateUrl: './duplicate-artists.component.html',
  imports: [TranslocoPipe, AdminListShellComponent, DuplicateMergeControlsComponent],
})
export class DuplicateArtistsComponent extends AbstractDuplicatePage<DuplicateArtistGroup> {
  private readonly artistAdminService = inject(ArtistAdminService);

  protected readonly titleKey = 'admin_duplicate_artists_title';
  protected readonly canonicalPath = 'admin/duplicate-artists';

  // Precompute merge candidates so their reference stays stable across change
  // detection (required by the merge-controls linkedSignal defaults).
  readonly rows = computed(() =>
    this.groups().map(group => ({
      group,
      candidates: group.artists.map<MergeCandidate>(artist => ({
        id: artist.id,
        // Lead with the ID so identical-name duplicates stay distinguishable.
        label: `#${artist.id} — ${artist.name}`,
      })),
    }))
  );

  protected fetchGroups(): Observable<DuplicateArtistGroup[]> {
    return this.artistAdminService.getDuplicateArtists();
  }
}
