import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  PLATFORM_ID,
  TransferState,
  makeStateKey,
  DOCUMENT,
  inject,
} from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { UserPlaylist } from '../models/playlist.model';
import { UserVideo, Video } from '../models/video.model';
import { FollowItem } from '../models/follow.model';
import { HomeAlbum } from '../models/album.model';
import { AuthStore } from '../store';
import { UserDataStore } from '../store/user-data/user-data.store';
import { QueueStore } from '../store/queue/queue.store';
import { UiStore } from '../store/ui/ui.store';

export interface PingResponse {
  est_connecte: boolean;
  pseudo: string;
  id_perso: string;
  mail: string;
  dark_mode_enabled: boolean;
  language: string;
  liste_playlist: UserPlaylist[];
  liste_suivi: FollowItem[];
  like_video: UserVideo[];
  liste_video: Video[];
  tab_index: number[];
  tab_video: string[];
}

const HOME_KEY = makeStateKey<{ top: HomeAlbum[]; top_albums: HomeAlbum[] }>('homeData');
const PING_KEY = makeStateKey<PingResponse>('pingData');

/**
 * InitService - Application initialization and session management
 *
 * Handles bootstrap, authentication state and SSR TransferState.
 */
@Injectable({
  providedIn: 'root',
})
export class InitService {
  private document = inject<Document>(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private readonly httpClient = inject(HttpClient);
  private transferState = inject(TransferState);
  private readonly translocoService = inject(TranslocoService);
  private readonly authStore = inject(AuthStore);
  private readonly userDataStore = inject(UserDataStore);
  private readonly queueStore = inject(QueueStore);
  private readonly uiStore = inject(UiStore);

  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.document
        .querySelector('link[rel=icon]')
        ?.setAttribute('href', `${environment.URL_ASSETS}assets/img/favicon.png`);
    }
    this.translocoService.setActiveLang(environment.lang);
  }

  public getPing(): Observable<boolean> {
    const storedValue = this.transferState.get<PingResponse | undefined>(PING_KEY, undefined);
    if (storedValue && this.isBrowser) {
      this.transferState.remove(PING_KEY);
      this.handlePingResponse(storedValue);
      return of(true);
    }

    return this.httpClient.get<PingResponse>(environment.URL_SERVER + 'ping').pipe(
      tap(data => {
        this.handlePingResponse(data);
      }),
      map(() => true),
      catchError(() => {
        return of(false);
      })
    );
  }

  private handlePingResponse(data: PingResponse): void {
    let listPlaylist: UserPlaylist[] = [];
    let listFollow: FollowItem[] = [];
    let listLikeVideo: UserVideo[] = [];

    if (data.est_connecte) {
      listPlaylist = data.liste_playlist;
      listFollow = data.liste_suivi;
      listLikeVideo = data.like_video;

      this.authStore.login(
        { pseudo: data.pseudo, idPerso: data.id_perso, mail: data.mail },
        {
          darkModeEnabled: data.dark_mode_enabled,
          language: data.language as 'fr' | 'en',
        }
      );
    } else {
      this.authStore.initializeAnonymous();
    }

    this.userDataStore.initialize({
      playlists: listPlaylist,
      follows: listFollow,
      likedVideos: listLikeVideo,
      initialVideos: data.liste_video,
      initialTabIndex: data.tab_index,
    });

    if (data.liste_video && data.liste_video.length > 0) {
      this.queueStore.setQueue(data.liste_video, data.liste_video[0]?.id_playlist ?? null, null);
    }
  }

  loginSuccess(
    pseudo: string,
    idPerso: string,
    mail: string,
    darkModeEnabled: boolean,
    language: string
  ) {
    this.authStore.login(
      { pseudo, idPerso, mail },
      { darkModeEnabled, language: language as 'fr' | 'en' }
    );
  }

  logOut() {
    this.authStore.logout();

    if (this.isBrowser) {
      document.cookie = 'login= ; expires=Sun, 01 Jan 2000 00:00:00 UTC; path=/';
    }
  }

  onMessageUnlog() {
    this.uiStore.showSessionExpired();
    this.authStore.logout();
  }

  getHomeInit(): Observable<{ top: HomeAlbum[]; top_albums: HomeAlbum[] }> {
    const storedValue = this.transferState.get(HOME_KEY, null);
    if (storedValue && this.isBrowser) {
      this.transferState.remove(HOME_KEY);
      return of(storedValue);
    }

    return this.httpClient
      .get<{ top: HomeAlbum[]; top_albums: HomeAlbum[] }>(environment.URL_SERVER + 'home_init')
      .pipe(
        tap(response => {
          if (!this.isBrowser) {
            this.transferState.set(HOME_KEY, response);
          }
        })
      );
  }
}
