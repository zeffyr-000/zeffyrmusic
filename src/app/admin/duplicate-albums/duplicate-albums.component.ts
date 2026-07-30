import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AbstractAdminListPage } from '../abstract-admin-list-page';
import { AdminListShellComponent } from '../admin-list-shell/admin-list-shell.component';
import {
  DuplicateMergeControlsComponent,
  MergeCandidate,
} from '../duplicate-merge-controls/duplicate-merge-controls.component';
import { DefaultImageDirective } from '../../directives/default-image.directive';
import { AlbumAdminService } from '../../services/album-admin.service';
import { DuplicateAlbumGroup } from '../../models/album-admin.model';

@Component({
  selector: 'app-duplicate-albums',
  templateUrl: './duplicate-albums.component.html',
  imports: [
    TranslocoPipe,
    AdminListShellComponent,
    DuplicateMergeControlsComponent,
    DefaultImageDirective,
  ],
})
export class DuplicateAlbumsComponent extends AbstractAdminListPage<DuplicateAlbumGroup> {
  private readonly albumAdminService = inject(AlbumAdminService);

  protected readonly titleKey = 'admin_duplicate_albums_title';
  protected readonly canonicalPath = 'admin/duplicate-albums';

  // Precompute merge candidates so their reference stays stable across change
  // detection (required by the merge-controls linkedSignal defaults).
  readonly rows = computed(() =>
    this.items().map(group => ({
      group,
      candidates: group.albums.map<MergeCandidate>(album => ({
        id: album.id,
        // Lead with the ID so identical title/artist duplicates stay distinguishable.
        label: `#${album.id} — ${album.title} — ${album.artist} (${album.year})`,
      })),
    }))
  );

  protected fetchItems(): Observable<DuplicateAlbumGroup[]> {
    return this.albumAdminService.getDuplicateAlbums();
  }
}
