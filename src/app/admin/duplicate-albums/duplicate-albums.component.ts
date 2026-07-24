import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { AbstractDuplicatePage } from '../abstract-duplicate-page';
import { AdminListShellComponent } from '../admin-list-shell/admin-list-shell.component';
import { DefaultImageDirective } from '../../directives/default-image.directive';
import { AlbumAdminService } from '../../services/album-admin.service';
import { DuplicateAlbumGroup } from '../../models/album-admin.model';

@Component({
  selector: 'app-duplicate-albums',
  templateUrl: './duplicate-albums.component.html',
  imports: [TranslocoPipe, RouterLink, AdminListShellComponent, DefaultImageDirective],
})
export class DuplicateAlbumsComponent extends AbstractDuplicatePage<DuplicateAlbumGroup> {
  private readonly albumAdminService = inject(AlbumAdminService);

  protected readonly titleKey = 'admin_duplicate_albums_title';
  protected readonly canonicalPath = 'admin/duplicate-albums';

  protected fetchGroups(): Observable<DuplicateAlbumGroup[]> {
    return this.albumAdminService.getDuplicateAlbums();
  }
}
