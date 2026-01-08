import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { PlayerService } from '../services/player.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Album, Extra } from '../models/search.model';
import { Subscription } from 'rxjs';
import { ArtistResult } from '../models/artist.model';
import { PlaylistResult } from '../models/playlist.model';
import { Video } from '../models/video.model';
import { SearchService } from '../services/search.service';
import { isPlatformBrowser, SlicePipe } from '@angular/common';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { ToMMSSPipe } from 'src/app/pipes/to-mmss.pipe';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { AuthStore, QueueStore } from '../store';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DefaultImageDirective, SlicePipe, TranslocoPipe, ToMMSSPipe, NgbTooltip],
})
export class SearchComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private readonly searchService = inject(SearchService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly translocoService = inject(TranslocoService);
  private readonly playerService = inject(PlayerService);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  readonly authStore = inject(AuthStore);
  readonly queueStore = inject(QueueStore);

  readonly query = signal('');
  readonly isLoading1 = signal(false);
  readonly isLoading2 = signal(false);
  readonly isLoading3 = signal(false);

  readonly listArtists = signal<ArtistResult[] | undefined>(undefined);
  readonly limitArtist = signal(5);

  readonly listAlbums = signal<Album[] | undefined>(undefined);
  readonly limitAlbum = signal(5);

  readonly listTracks = signal<Video[] | undefined>(undefined);
  readonly limitTrack = signal(5);

  readonly listExtras = signal<Extra[] | undefined>(undefined);
  readonly limitExtra = signal(5);

  private isBrowser: boolean;
  private paramMapSubscription!: Subscription;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.paramMapSubscription = this.activatedRoute.paramMap.subscribe(params => {
      this.query.set(params.get('query') ?? '');
      this.isLoading1.set(true);
      this.isLoading2.set(true);
      if (this.authStore.isAuthenticated()) {
        this.isLoading3.set(true);
      }
      this.listArtists.set(undefined);
      this.listAlbums.set(undefined);
      this.listTracks.set(undefined);
      this.listExtras.set(undefined);

      this.searchService
        .fullSearch1(this.query())
        .subscribe((data: { artist: ArtistResult[]; playlist: PlaylistResult[] }) => {
          this.isLoading1.set(false);

          this.titleService.setTitle(
            this.translocoService.translate('resultats_recherche', { query: this.query() }) +
              ' - Zeffyr Music'
          );
          const description = this.translocoService.translate('description_search', {
            query: this.query(),
          });
          if (description) {
            this.metaService.updateTag({
              name: 'description',
              content: description,
            });
          }

          this.listArtists.set(data.artist);
          this.limitArtist.set(5);

          this.listAlbums.set(data.playlist);
          this.limitAlbum.set(5);
        });

      this.searchService.fullSearch2(this.query()).subscribe((data: { tab_video: Video[] }) => {
        this.isLoading2.set(false);

        this.listTracks.set(data.tab_video);
        this.limitTrack.set(5);
      });

      if (this.authStore.isAuthenticated()) {
        this.searchService.fullSearch3(this.query()).subscribe((data: { tab_extra: Extra[] }) => {
          this.isLoading3.set(false);

          this.listExtras.set(data.tab_extra || []);
          this.limitExtra.set(5);
        });
      }

      if (this.isBrowser) {
        this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
      }
    });
  }

  moreArtists() {
    this.limitArtist.set(this.listArtists()?.length ?? 0);
  }

  moreAlbums() {
    this.limitAlbum.set(this.listAlbums()?.length ?? 0);
  }

  runPlaylistTrack(index: number) {
    const tracks = this.listTracks();
    if (tracks) {
      this.playerService.runPlaylist(tracks, index);
    }
  }

  addVideo(key: string, artist: string, title: string, duration: string | number) {
    this.playerService.addVideoInPlaylist(key, artist, title, duration);
  }

  moreTracks() {
    this.limitTrack.set(this.listTracks()?.length ?? 0);
  }

  runPlaylistExtra(index: number) {
    const extras = this.listExtras();
    if (!extras) return;
    const listTransformed = extras.map(e => ({
      ...e,
      titre: e.title,
    })) as unknown as Video[];

    this.playerService.runPlaylist(listTransformed, index);
  }

  moreExtras() {
    this.limitExtra.set(this.listExtras()?.length ?? 0);
  }

  ngOnDestroy() {
    this.paramMapSubscription.unsubscribe();
  }
}
