import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from '../../environments/environment';
import { Album } from '../models/album.model';
import { ArtistService } from '../services/artist.service';
import { ShareButtons } from 'ngx-sharebuttons/buttons';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { isPlatformBrowser } from '@angular/common';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-artist',
  templateUrl: './artist.component.html',
  styleUrls: ['./artist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShareButtons, RouterLink, DefaultImageDirective, TranslocoPipe],
})
export class ArtistComponent implements OnInit {
  private readonly artistService = inject(ArtistService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);

  readonly name = signal('');
  readonly idArtistDeezer = signal('');
  readonly urlDeezer = signal('');
  readonly listAlbums = signal<Album[]>([]);
  readonly isAvailable = signal<boolean | undefined>(undefined);

  private isBrowser: boolean;

  constructor() {
    const platformId = inject(PLATFORM_ID);

    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(() => {
      this.initLoad();
    });
  }

  initLoad() {
    const idArtist = this.activatedRoute.snapshot.paramMap.get('id_artist');

    if (!idArtist) {
      this.isAvailable.set(false);
      return;
    }

    this.artistService
      .getArtist(idArtist)
      .subscribe(
        (data: {
          nom: string;
          id_artiste_deezer: string;
          id_artist: string;
          list_albums: Album[];
        }) => {
          if (data.nom) {
            this.isAvailable.set(true);
            this.name.set(data.nom);
            this.idArtistDeezer.set(data.id_artiste_deezer);
            this.urlDeezer.set(
              'https://api.deezer.com/artist/' + data.id_artiste_deezer + '/image?size=big'
            );
            this.listAlbums.set(data.list_albums);

            this.titleService.setTitle(
              this.translocoService.translate('title_artist', { artist: this.name() })
            );

            this.metaService.updateTag({
              name: 'og:title',
              content:
                this.translocoService.translate('title_artist', { artist: this.name() }) || '',
            });
            this.metaService.updateTag({
              name: 'og:description',
              content:
                this.translocoService.translate('description_partage_artist', {
                  artist: this.name(),
                }) || '',
            });
            this.metaService.updateTag({ name: 'og:image', content: this.urlDeezer() });
            this.metaService.updateTag({
              name: 'og:url',
              content: `${environment.URL_BASE}artist/${idArtist}`,
            });
            this.seoService.updateCanonicalUrl(`${environment.URL_BASE}artist/${idArtist}`);

            this.metaService.updateTag({
              name: 'description',
              content:
                this.translocoService.translate('description_artist', {
                  artist: this.name(),
                  count: this.listAlbums().length,
                }) || '',
            });
          } else {
            this.isAvailable.set(false);
          }

          if (this.isBrowser) {
            this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
          }
        }
      );
  }
}
