import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  TemplateRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { environment } from '../../environments/environment';
import { Album } from '../models/album.model';
import { ArtistData, RelatedArtist } from '../models/artist.model';
import { ArtistService } from '../services/artist.service';
import { ShareButtons } from 'ngx-sharebuttons/buttons';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { SkeletonArtistComponent } from '../directives/skeleton-artist/skeleton-artist.component';
import { isPlatformBrowser } from '@angular/common';
import { SeoService } from '../services/seo.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthStore } from '../store';

@Component({
  selector: 'app-artist',
  templateUrl: './artist.component.html',
  styleUrl: './artist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ShareButtons,
    RouterLink,
    DefaultImageDirective,
    SkeletonArtistComponent,
    TranslocoPipe,
  ],
})
export class ArtistComponent implements OnInit {
  private readonly artistService = inject(ArtistService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly modalService = inject(NgbModal);
  readonly authStore = inject(AuthStore);

  readonly name = signal('');
  readonly idArtistDeezer = signal('');
  readonly urlDeezer = signal('');
  readonly listAlbums = signal<Album[]>([]);
  readonly isAvailable = signal<boolean | undefined>(undefined);
  readonly isLoading = signal(true);
  readonly biographyFr = signal('');
  readonly biographyEn = signal('');
  readonly relatedArtists = signal<RelatedArtist[]>([]);
  readonly biographyExpanded = signal(false);

  private static readonly BIOGRAPHY_MAX_LENGTH = 120;

  readonly biography = computed(() => {
    const lang = this.authStore.language();
    return lang === 'en' ? this.biographyEn() : this.biographyFr();
  });

  readonly biographyTruncated = computed(() => {
    const bio = this.biography();
    if (bio.length <= ArtistComponent.BIOGRAPHY_MAX_LENGTH) {
      return bio;
    }
    const slice = bio.substring(0, ArtistComponent.BIOGRAPHY_MAX_LENGTH);
    const lastSpaceIndex = slice.lastIndexOf(' ');
    const truncated = lastSpaceIndex > 0 ? slice.substring(0, lastSpaceIndex) : slice;
    return `${truncated}…`;
  });

  readonly biographyNeedsTruncation = computed(() => {
    return this.biography().length > ArtistComponent.BIOGRAPHY_MAX_LENGTH;
  });

  private isBrowser: boolean;

  constructor() {
    const platformId = inject(PLATFORM_ID);

    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.resetState();
      this.initLoad();
    });
  }

  /**
   * Reset component state when navigating to a different artist
   */
  private resetState(): void {
    this.isLoading.set(true);
    this.isAvailable.set(undefined);
    this.name.set('');
    this.idArtistDeezer.set('');
    this.urlDeezer.set('');
    this.listAlbums.set([]);
    this.biographyFr.set('');
    this.biographyEn.set('');
    this.relatedArtists.set([]);
    this.biographyExpanded.set(false);

    // Scroll to top when navigating to a new artist
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  initLoad() {
    const idArtist = this.activatedRoute.snapshot.paramMap.get('id_artist');

    if (!idArtist) {
      this.isLoading.set(false);
      this.isAvailable.set(false);
      return;
    }

    this.artistService
      .getArtist(idArtist)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: ArtistData) => {
          this.isLoading.set(false);
          if (data.nom) {
            this.isAvailable.set(true);
            this.name.set(data.nom);
            this.idArtistDeezer.set(data.id_artiste_deezer);
            this.urlDeezer.set(
              'https://api.deezer.com/artist/' + data.id_artiste_deezer + '/image?size=big'
            );
            this.listAlbums.set(data.list_albums);
            this.biographyFr.set(data.biography_fr ?? '');
            this.biographyEn.set(data.biography_en ?? '');
            this.relatedArtists.set(data.related_artists ?? []);

            this.titleService.setTitle(
              this.translocoService.translate('title_artist', { artist: this.name() })
            );

            this.metaService.updateTag({
              name: 'og:title',
              content:
                this.translocoService.translate('title_artist', { artist: this.name() }) || '',
            });

            // Use biography excerpt for meta description if available
            const bioRaw = this.biography().substring(0, 150).trim();
            const bioExcerpt =
              bioRaw.length > 0 ? (/(\.{3}|…)$/.test(bioRaw) ? bioRaw : `${bioRaw}...`) : '';

            const metaDescription = bioExcerpt
              ? this.translocoService.translate('description_artist_bio', {
                  artist: this.name(),
                  description: bioExcerpt,
                  count: this.listAlbums().length,
                })
              : this.translocoService.translate('description_artist', {
                  artist: this.name(),
                  count: this.listAlbums().length,
                });

            this.metaService.updateTag({
              name: 'og:description',
              content: metaDescription || '',
            });
            this.metaService.updateTag({ name: 'og:image', content: this.urlDeezer() });
            this.metaService.updateTag({
              name: 'og:url',
              content: `${environment.URL_BASE}artist/${idArtist}`,
            });
            this.metaService.updateTag({ name: 'og:type', content: 'music.musician' });
            this.seoService.updateCanonicalUrl(`${environment.URL_BASE}artist/${idArtist}`);

            this.metaService.updateTag({
              name: 'description',
              content: metaDescription || '',
            });
          } else {
            this.isAvailable.set(false);
          }

          if (this.isBrowser) {
            this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.isAvailable.set(false);
        },
      });
  }

  openShareModal(content: TemplateRef<unknown>): void {
    this.modalService.open(content, {
      centered: true,
      size: 'md',
    });
  }

  toggleBiography(): void {
    this.biographyExpanded.update(v => !v);
  }
}
