import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
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
  private readonly cdr = inject(ChangeDetectorRef);
  readonly authStore = inject(AuthStore);
  readonly queueStore = inject(QueueStore);

  query: string;
  isLoading1: boolean;
  isLoading2: boolean;
  isLoading3: boolean;
  private isBrowser: boolean;

  listArtists: ArtistResult[];
  limitArtist: number;

  listAlbums: Album[];
  limitAlbum: number;

  listTracks: Video[];
  limitTrack: number;

  listExtras: Extra[];
  limitExtra: number;

  private paramMapSubscription: Subscription;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.paramMapSubscription = this.activatedRoute.paramMap.subscribe(params => {
      this.query = params.get('query');
      this.isLoading1 = true;
      this.isLoading2 = true;
      if (this.authStore.isAuthenticated()) {
        this.isLoading3 = true;
      }
      this.listArtists = undefined;
      this.listAlbums = undefined;
      this.listTracks = undefined;
      this.listExtras = undefined;

      this.searchService
        .fullSearch1(this.query)
        .subscribe((data: { artist: ArtistResult[]; playlist: PlaylistResult[] }) => {
          this.isLoading1 = false;

          this.titleService.setTitle(
            this.translocoService.translate('resultats_recherche', { query: this.query }) +
              ' - Zeffyr Music'
          );
          this.metaService.updateTag({
            name: 'description',
            content: this.translocoService.translate('description_search', { query: this.query }),
          });

          this.listArtists = data.artist;
          this.limitArtist = 5;

          this.listAlbums = data.playlist;
          this.limitAlbum = 5;

          this.cdr.markForCheck();
        });

      this.searchService.fullSearch2(this.query).subscribe((data: { tab_video: Video[] }) => {
        this.isLoading2 = false;

        this.listTracks = data.tab_video;
        this.limitTrack = 5;

        this.cdr.markForCheck();
      });

      if (this.authStore.isAuthenticated()) {
        this.searchService.fullSearch3(this.query).subscribe((data: { tab_extra: Extra[] }) => {
          this.isLoading3 = false;

          this.listExtras = data.tab_extra || [];
          this.limitExtra = 5;

          this.cdr.markForCheck();
        });
      }

      if (this.isBrowser) {
        this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
      }
    });
  }

  moreArtists() {
    this.limitArtist = this.listArtists.length;
  }

  moreAlbums() {
    this.limitAlbum = this.listAlbums.length;
  }

  runPlaylistTrack(index: number) {
    this.playerService.runPlaylist(this.listTracks, index);
  }

  addVideo(key: string, artist: string, title: string, duration: number) {
    this.playerService.addVideoInPlaylist(key, artist, title, duration);
  }

  moreTracks() {
    this.limitTrack = this.listTracks.length;
  }

  runPlaylistExtra(index: number) {
    const listTransformed = this.listExtras.map(e => ({
      ...e,
      titre: e.title,
    })) as unknown as Video[];

    this.playerService.runPlaylist(listTransformed, index);
  }

  moreExtras() {
    this.limitExtra = this.listExtras.length;
  }

  ngOnDestroy() {
    this.paramMapSubscription.unsubscribe();
  }
}
