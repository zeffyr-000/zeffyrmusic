import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  effect,
  computed,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { environment } from 'src/environments/environment';
import { PlayerService } from '../services/player.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import { Video } from '../models/video.model';
import { Playlist } from '../models/playlist.model';
import { PlaylistService } from '../services/playlist.service';
import { APP_BASE_HREF, isPlatformBrowser } from '@angular/common';
import { DefaultImageDirective } from '../directives/default-image.directive';
import { ShareButtons } from 'ngx-sharebuttons/buttons';
import { LazyLoadImageDirective } from '../directives/lazy-load-image.directive';
import { ArtistListComponent } from './artist-list/artist-list.component';
import {
  NgbDropdown,
  NgbDropdownToggle,
  NgbDropdownMenu,
  NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { ToMMSSPipe } from 'src/app/pipes/to-mmss.pipe';
import { SeoService } from '../services/seo.service';
import { UserLibraryService } from '../services/user-library.service';
import { UserDataStore } from '../store/user-data/user-data.store';
import { AuthStore, PlayerStore, QueueStore } from '../store';

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DefaultImageDirective,
    RouterLink,
    ShareButtons,
    LazyLoadImageDirective,
    ArtistListComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    TranslocoPipe,
    ToMMSSPipe,
  ],
})
export class PlaylistComponent {
  private platformId = inject(PLATFORM_ID);
  private baseHref = inject(APP_BASE_HREF, { optional: true });
  private readonly playlistService = inject(PlaylistService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly playerService = inject(PlayerService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly router = inject(Router);
  readonly userDataStore = inject(UserDataStore);
  readonly authStore = inject(AuthStore);
  readonly playerStore = inject(PlayerStore);
  readonly queueStore = inject(QueueStore);
  readonly userLibraryService = inject(UserLibraryService);

  readonly isLoading = signal(true);
  readonly isPrivate = signal(false);
  readonly idPlaylist = signal<string | null>(null);
  readonly playlist = signal<Video[]>([]);
  readonly imgBig = signal('');
  readonly idTopCharts = signal<string | null>(null);
  readonly idPersoOwner = signal('');
  readonly title = signal('');
  readonly titre = signal('');
  readonly description = signal('');
  readonly artist = signal<string | null>(null);
  readonly idArtist = signal<string | null>(null);
  readonly isLikePage = signal(false);
  isBrowser: boolean;

  // Computed signal pour suivre si l'utilisateur suit cette playlist
  readonly isFollower = computed(() => {
    const id = this.idPlaylist();
    if (!id) {
      return false;
    }
    return this.userDataStore.isFollowing(id);
  });

  // Computed signal pour la playlist en cours de lecture
  readonly currentIdPlaylistPlaying = computed(() => {
    return this.queueStore.sourcePlaylistId() || '';
  });

  private lastAdjustedKey: string | null = null;
  private lastAdjustedDuration = 0;
  private pendingKeyChange = false;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    this.activatedRoute.params.subscribe(() => {
      this.isLoading.set(true);
      this.initLoad();
    });

    // Effect to adjust playlist duration when track changes
    effect(() => {
      const currentKey = this.queueStore.currentKey();
      const duration = this.playerStore.duration();

      if (!currentKey || duration <= 0) {
        return;
      }

      if (currentKey !== this.lastAdjustedKey) {
        this.lastAdjustedKey = currentKey;
        this.lastAdjustedDuration = duration;
        this.pendingKeyChange = true;
        return;
      }

      if (this.pendingKeyChange) {
        if (Math.abs(duration - this.lastAdjustedDuration) > 1) {
          this.pendingKeyChange = false;
          this.lastAdjustedDuration = duration;
          this.adjustPlaylistDuration(duration);
        }
        return;
      }

      if (Math.abs(duration - this.lastAdjustedDuration) > 1) {
        this.lastAdjustedDuration = duration;
        this.adjustPlaylistDuration(duration);
      }
    });

    // Effect to sync liked videos to playlist on like page
    effect(() => {
      const likedVideos = this.userDataStore.likedVideos();
      if (!this.isLikePage() || !likedVideos || likedVideos.length === 0) {
        return;
      }

      this.playlist.set(
        likedVideos.map(element => {
          const elementToPush = { ...element } as unknown as Video;
          elementToPush.artists = [{ label: element.artiste, id_artist: '' }];
          return elementToPush;
        })
      );
    });
  }

  initLoad() {
    if (this.activatedRoute.snapshot.url[0].path === 'like') {
      this.loadLike();
    } else {
      const idPlaylist = this.activatedRoute.snapshot.paramMap.get('id_playlist');
      const id = this.activatedRoute.snapshot.paramMap.get('id');

      let url: string;
      if (idPlaylist !== null) {
        url = environment.URL_SERVER + 'json/playlist/' + idPlaylist;
      } else {
        if (this.activatedRoute.snapshot.url[0].path === 'top') {
          url = environment.URL_SERVER + 'json/top/' + id;
        } else {
          url = '';
        }
      }

      this.loadPlaylist(url);
    }
  }

  getMetaDescription(data: Playlist) {
    let description = '';

    if (data.id_top !== undefined) {
      description = this.translocoService.translate('description_top', {
        title: data.title,
        count: data.tab_video?.length || 0,
        description: data.description,
      });
    } else {
      if (data.artiste !== undefined && data.titre !== undefined) {
        description = this.translocoService.translate(
          data.artiste ? 'description_album_artist' : 'description_album',
          {
            title: data.titre,
            artist: data.artiste,
            year: data.year,
            count: data.tab_video?.length || 0,
          }
        );
      } else {
        description = this.translocoService.translate('description_playlist', {
          title: data.title,
          count: data.tab_video?.length || 0,
        });
      }
    }
    return description;
  }

  getMetaTitle(data: Playlist) {
    let title = '';

    if (data.id_top !== undefined) {
      if (data.decade) {
        title = this.translocoService.translate('title_top_decade', { title: data.title });
      } else {
        title = this.translocoService.translate('title_top_element', { title: data.title });
      }
    } else {
      if (data.artiste !== undefined && data.titre !== undefined) {
        title = this.translocoService.translate(
          data.artiste ? 'title_album_artist' : 'title_album',
          {
            title: data.titre,
            artist: data.artiste,
            year: data.year,
            count: data.tab_video?.length || 0,
          }
        );
      } else {
        title = data.title;
      }
    }
    return title;
  }

  loadPlaylist(url: string) {
    this.resetAdjustmentState();

    this.playlistService
      .getPlaylist(url, this.idPlaylist() ?? undefined)
      .subscribe((data: Playlist) => {
        this.isLoading.set(false);

        if (data.est_prive === undefined) {
          this.updatePlaylistState(data);
          this.updateSeoMetadata(data);
        } else {
          this.isPrivate.set(true);
        }

        this.trackPageView();
      });
  }

  loadLike() {
    this.resetAdjustmentState();
    this.resetToDefaultState();
    this.isLikePage.set(true);

    const likedVideos = this.userDataStore.likedVideos();
    if (likedVideos && likedVideos.length > 0) {
      this.playlist.set(
        likedVideos.map(element => {
          const elementToPush = { ...element } as unknown as Video;
          elementToPush.artists = [{ label: element.artiste, id_artist: '' }];
          return elementToPush;
        })
      );
    }

    this.titleService.setTitle(this.translocoService.translate('mes_likes') + ' - Zeffyr Music');
    this.clearOgMetaTags();
    this.updateCanonicalUrl();
    this.trackPageView();
  }

  /** Resets duration adjustment tracking state */
  private resetAdjustmentState(): void {
    this.lastAdjustedKey = null;
    this.lastAdjustedDuration = 0;
  }

  /** Resets playlist signals to default values */
  private resetToDefaultState(): void {
    this.isLoading.set(false);
    this.isPrivate.set(false);
    this.idPlaylist.set('');
    this.playlist.set([]);
    this.imgBig.set(`${environment.URL_ASSETS}assets/img/default.jpg`);
    this.idTopCharts.set(null);
    this.title.set('');
    this.titre.set('');
    this.description.set('');
    this.artist.set(null);
    this.idArtist.set(null);
    this.idPersoOwner.set('');
  }

  /** Updates component state from playlist data */
  private updatePlaylistState(data: Playlist): void {
    this.isPrivate.set(false);
    this.idPlaylist.set(data.id_playlist);
    this.playlist.set(data.tab_video);
    this.imgBig.set(data.img_big || `${environment.URL_ASSETS}assets/img/default.jpg`);
    this.idTopCharts.set(data.id_top || null);
    this.title.set(data.title);
    this.titre.set(data.titre || '');
    this.description.set(data.description || '');
    this.artist.set(data.artiste || '');
    this.idArtist.set(data.id_artiste ?? null);
    this.idPersoOwner.set(data.id_perso);

    if (data.est_suivi && !this.userDataStore.isFollowing(data.id_playlist)) {
      this.userDataStore.addFollow({
        id_playlist: data.id_playlist,
        titre: data.titre || data.title,
        artiste: data.artiste,
        url_image: data.img_big,
      });
    }
  }

  /** Updates SEO metadata for the playlist */
  private updateSeoMetadata(data: Playlist): void {
    this.titleService.setTitle(this.getMetaTitle(data));
    this.metaService.updateTag({ name: 'og:title', content: this.getMetaTitle(data) });
    this.metaService.updateTag({ name: 'description', content: this.getMetaDescription(data) });

    const ogDescription = this.getOgDescription(data);
    this.metaService.updateTag({ name: 'og:description', content: ogDescription });

    if (data.og_image || data.img_big) {
      this.metaService.updateTag({ name: 'og:image', content: data.og_image || data.img_big });
    }

    this.updateCanonicalUrl(data);
  }

  /** Generates OpenGraph description based on playlist type */
  private getOgDescription(data: Playlist): string {
    if (data.artiste !== undefined && data.titre !== undefined) {
      return (
        this.translocoService.translate('description_partage', {
          artiste: data.artiste,
          album: data.titre,
        }) || ''
      );
    }
    return (
      this.translocoService.translate('description_partage_playlist', {
        playlist: data.title,
      }) || ''
    );
  }

  /** Clears OpenGraph meta tags */
  private clearOgMetaTags(): void {
    this.metaService.updateTag({ name: 'og:title', content: '' });
    this.metaService.updateTag({ name: 'og:description', content: '' });
    this.metaService.updateTag({ name: 'og:image', content: '' });
  }

  /** Updates canonical URL for SEO */
  private updateCanonicalUrl(data?: Playlist): void {
    if (this.isBrowser) {
      this.metaService.updateTag({ name: 'og:url', content: document.location.href });
      this.seoService.updateCanonicalUrl(document.location.href);
    } else if (data) {
      const url = data.id_top
        ? `${environment.URL_BASE}top/${data.id_top}`
        : `${environment.URL_BASE}playlist/${this.idPlaylist()}`;
      this.metaService.updateTag({ name: 'og:url', content: url });
      this.seoService.updateCanonicalUrl(url);
    } else {
      const url = `https://www.${this.baseHref}/${this.router.url}`;
      this.metaService.updateTag({ name: 'og:url', content: url });
      this.seoService.updateCanonicalUrl(url);
    }
  }

  /** Tracks page view in Google Analytics */
  private trackPageView(): void {
    if (this.isBrowser) {
      this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
    }
  }

  switchFollow() {
    const id = this.idPlaylist();
    if (id) {
      this.userLibraryService
        .toggleFollow(id, this.titre(), this.artist() ?? '', this.imgBig())
        .subscribe();
    }
  }

  runPlaylist(index = 0) {
    this.playerService.runPlaylist(this.playlist(), index, this.idTopCharts());
  }

  pausePlaylist() {
    this.playerService.onPlayPause();
  }

  addInCurrentList() {
    this.playerService.addInCurrentList(this.playlist(), this.idTopCharts());
  }

  addVideo(key: string, artist: string, title: string, duration: string | number) {
    this.playerService.addVideoInPlaylist(key, artist, title, duration);
  }

  removeVideo(idVideo: string) {
    this.userLibraryService.removeVideoFromPlaylist(idVideo).subscribe(success => {
      if (success) {
        this.playerService.removeVideoFromQueue(idVideo);
        this.loadPlaylist('');
      }
    });
  }

  addVideoAfterCurrentInList(video: Video) {
    this.playerService.addVideoAfterCurrentInList(video);
  }

  addVideoInEndCurrentList(video: Video) {
    this.playerService.addInCurrentList([video], this.idTopCharts());
  }

  sumDurationPlaylist() {
    const currentPlaylist = this.playlist();
    if (currentPlaylist !== undefined) {
      let charDuration = '';
      let sumDuration = 0;

      for (const element of currentPlaylist) {
        if (Number.parseInt(element.duree, 10) > 0) {
          sumDuration += Number.parseInt(element.duree, 10);
        }
      }

      const hour = Math.floor(sumDuration / 3600);
      if (hour > 0) {
        charDuration += hour + ' h ';
        sumDuration -= 3600 * hour;
      }

      const minut = Math.floor(sumDuration / 60);
      if (minut > 0) {
        charDuration += minut + ' min';
      }

      return charDuration;
    } else {
      return '';
    }
  }

  adjustPlaylistDuration(totalTime: number) {
    const currentKey = this.queueStore.currentKey();
    const updatedPlaylist = this.playlist().map(video => {
      if (video.key === currentKey) {
        return { ...video, duree: totalTime.toString() };
      }
      return video;
    });
    this.playlist.set(updatedPlaylist);
  }
}
