import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AbstractDuplicatePage } from '../abstract-duplicate-page';
import { AdminListShellComponent } from '../admin-list-shell/admin-list-shell.component';
import { ArtistAdminService } from '../../services/artist-admin.service';
import { DuplicateArtistGroup } from '../../models/artist-admin.model';

@Component({
  selector: 'app-duplicate-artists',
  templateUrl: './duplicate-artists.component.html',
  imports: [TranslocoPipe, RouterLink, AdminListShellComponent],
})
export class DuplicateArtistsComponent extends AbstractDuplicatePage<DuplicateArtistGroup> {
  private readonly artistAdminService = inject(ArtistAdminService);

  protected readonly titleKey = 'admin_duplicate_artists_title';
  protected readonly canonicalPath = 'admin/duplicate-artists';

  protected fetchGroups(): Observable<DuplicateArtistGroup[]> {
    return this.artistAdminService.getDuplicateArtists();
  }
}
