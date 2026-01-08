import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  ChangeDetectorRef,
  PLATFORM_ID,
  inject,
  effect,
  computed,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { environment } from 'src/environments/environment';
import { InitService } from '../services/init.service';
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
  private readonly ref = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private baseHref = inject(APP_BASE_HREF, { optional: true });
  private readonly playlistService = inject(PlaylistService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly initService = inject(InitService);
  private readonly playerService = inject(PlayerService);
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly seoService = inject(SeoService);
  private readonly translocoService = inject(TranslocoService);
  private readonly googleAnalyticsService = inject(GoogleAnalyticsService);
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  readonly userDataStore = inject(UserDataStore);
  readonly authStore = inject(AuthStore);
  readonly playerStore = inject(PlayerStore);
  readonly queueStore = inject(QueueStore);
  readonly userLibraryService = inject(UserLibraryService);

  isLoading = true;
  isPrivate = false;
  idPlaylist: string | null = null;
  playlist: Video[] = [];
  imgBig = '';
  idTopCharts: string | null = null;
  idPersoOwner = '';
  title = '';
  titre = '';
  description = '';
  artist: string | null = null;
  idArtist: string | null = null;
  isLikePage = false;
  isBrowser: boolean;

  // Computed signal pour suivre si l'utilisateur suit cette playlist
  readonly isFollower = computed(() => {
    if (!this.idPlaylist) {
      return false;
    }
    return this.userDataStore.isFollowing(this.idPlaylist);
  });

  // Computed signal pour la playlist en cours de lecture
  readonly currentIdPlaylistPlaying = computed(() => {
    return this.queueStore.sourcePlaylistId() || '';
  });

  private adjustDurationEffect = effect(() => {
    const currentKey = this.queueStore.currentKey();
    const duration = this.playerStore.duration();
    if (currentKey && duration > 0) {
      this.adjustPlaylistDuration(duration);
    }
  });

  private likedVideosEffect = effect(() => {
    const likedVideos = this.userDataStore.likedVideos();

    // Ne rien faire si pas sur la page like ou si pas de vidéos
    if (!this.isLikePage || !likedVideos || likedVideos.length === 0) {
      return;
    }

    // Clear and rebuild playlist from liked videos
    this.playlist = likedVideos.map(element => {
      const elementToPush = { ...element } as unknown as Video;
      elementToPush.artists = [{ label: element.artiste, id_artist: '' }];
      return elementToPush;
    });
    this.ref.markForCheck();
  });

  constructor() {
    const activatedRoute = this.activatedRoute;

    this.isBrowser = isPlatformBrowser(this.platformId);

    activatedRoute.params.subscribe(() => {
      this.isLoading = true;
      this.initLoad();
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
    this.playlistService.getPlaylist(url, this.idPlaylist).subscribe((data: Playlist) => {
      this.isLoading = false;

      if (data.est_prive === undefined) {
        this.isPrivate = false;
        this.idPlaylist = data.id_playlist;
        this.playlist = data.tab_video;
        this.imgBig = data.img_big || `${environment.URL_ASSETS}assets/img/default.jpg`;
        this.idTopCharts = data.id_top || null;
        this.title = data.title;
        this.titre = data.titre || '';
        this.description = data.description || '';
        // isFollower est calculé automatiquement via le computed signal basé sur userDataStore.follows()
        // Si le serveur retourne est_suivi=true mais que le store n'a pas encore cette info,
        // on peut ajouter le follow au store
        if (data.est_suivi && !this.userDataStore.isFollowing(data.id_playlist)) {
          this.userDataStore.addFollow({
            id_playlist: data.id_playlist,
            titre: data.titre || data.title,
            artiste: data.artiste,
            url_image: data.img_big,
          });
        }
        this.artist = data.artiste || '';
        this.idArtist = data.id_artiste;
        this.idPersoOwner = data.id_perso;

        this.titleService.setTitle(this.getMetaTitle(data));
        this.metaService.updateTag({ name: 'og:title', content: this.getMetaTitle(data) });
        this.metaService.updateTag({
          name: 'description',
          content: this.getMetaDescription(data),
        });

        if (data.artiste !== undefined && data.titre !== undefined) {
          this.metaService.updateTag({
            name: 'og:description',
            content: this.translocoService.translate('description_partage', {
              artiste: data.artiste,
              album: data.titre,
            }),
          });
        } else {
          this.metaService.updateTag({
            name: 'og:description',
            content: this.translocoService.translate('description_partage_playlist', {
              playlist: data.title,
            }),
          });
        }

        if (data.og_image !== undefined || data.img_big !== undefined) {
          this.metaService.updateTag({ name: 'og:image', content: data.og_image || data.img_big });
        }

        if (this.isBrowser) {
          this.metaService.updateTag({ name: 'og:url', content: document.location.href });
          this.seoService.updateCanonicalUrl(document.location.href);
        } else {
          if (data.id_top !== undefined) {
            this.metaService.updateTag({
              name: 'og:url',
              content: `${environment.URL_BASE}top/${data.id_top}`,
            });
            this.seoService.updateCanonicalUrl(`${environment.URL_BASE}top/${data.id_top}`);
          } else {
            this.metaService.updateTag({
              name: 'og:url',
              content: `${environment.URL_BASE}playlist/${this.idPlaylist}`,
            });
            this.seoService.updateCanonicalUrl(
              `${environment.URL_BASE}playlist/${this.idPlaylist}`
            );
          }
        }
      } else {
        this.isPrivate = true;
      }

      if (this.isBrowser) {
        this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
      }

      this.ref.markForCheck();
    });
  }

  loadLike() {
    this.isLoading = false;
    this.isPrivate = false;
    this.idPlaylist = '';
    this.playlist = [];
    this.imgBig = `${environment.URL_ASSETS}assets/img/default.jpg`;
    this.idTopCharts = null;
    this.title = '';
    this.titre = '';
    this.description = '';
    this.artist = null;
    this.idArtist = null;
    this.idPersoOwner = null;
    this.isLikePage = true;

    // Charger les vidéos likées initialement depuis le store
    const likedVideos = this.userDataStore.likedVideos();
    if (likedVideos && likedVideos.length > 0) {
      this.playlist = likedVideos.map(element => {
        const elementToPush = { ...element } as unknown as Video;
        elementToPush.artists = [{ label: element.artiste, id_artist: '' }];
        return elementToPush;
      });
    }

    this.titleService.setTitle(this.translocoService.translate('mes_likes') + ' - Zeffyr Music');
    this.metaService.updateTag({ name: 'og:title', content: '' });
    this.metaService.updateTag({ name: 'og:description', content: '' });
    this.metaService.updateTag({ name: 'og:image', content: '' });
    if (this.isBrowser) {
      this.metaService.updateTag({ name: 'og:url', content: document.location.href });
      this.seoService.updateCanonicalUrl(document.location.href);
    } else {
      this.metaService.updateTag({
        name: 'og:url',
        content: `https://www.${this.baseHref}/${this.router.url}`,
      });
      this.seoService.updateCanonicalUrl(`https://www.${this.baseHref}/${this.router.url}`);
    }

    if (this.isBrowser) {
      this.googleAnalyticsService.pageView(this.activatedRoute.snapshot.url.join('/'));
    }
  }

  switchFollow() {
    this.playerService.switchFollow(this.idPlaylist, this.titre, this.artist, this.imgBig);
  }

  runPlaylist(index = 0) {
    // Le queueStore.sourcePlaylistId() sera mis à jour par playerService.runPlaylist()
    this.playerService.runPlaylist(this.playlist, index, this.idTopCharts);
  }

  pausePlaylist() {
    this.playerService.onPlayPause();
  }

  addInCurrentList() {
    this.playerService.addInCurrentList(this.playlist, this.idTopCharts);
  }

  addVideo(key: string, artist: string, title: string, duration: number) {
    this.playerService.addVideoInPlaylist(key, artist, title, duration);
  }

  removeVideo(idVideo: string) {
    this.playerService.removeVideo(idVideo, this.loadPlaylist.bind(this));
  }

  addVideoAfterCurrentInList(video: Video) {
    this.playerService.addVideoAfterCurrentInList(video);
  }

  addVideoInEndCurrentList(video: Video) {
    this.playerService.addInCurrentList([video], this.idTopCharts);
  }

  sumDurationPlaylist() {
    if (this.playlist !== undefined) {
      let charDuration = '';
      let sumDuration = 0;

      for (const element of this.playlist) {
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
    this.playlist.forEach(video => {
      if (video.key === currentKey) {
        video.duree = totalTime.toString();
        this.ref.detectChanges();
      }
    });
  }
}
