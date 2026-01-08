/**
 * Typed interfaces for unit test mocks
 */
import type { MockedFunction } from 'vitest';
import type { Observable } from 'rxjs';
import type { Video, UserVideo } from './video.model';
import type { UserPlaylist } from './playlist.model';
import type { FollowItem } from './follow.model';
import type { LoginResponse, UserReponse } from './user.model';

/** Mock for PlayerService */
export interface MockPlayerService {
  lecture: MockedFunction<(indice: number, indexInitial?: boolean) => void>;
  before: MockedFunction<() => void>;
  after: MockedFunction<() => void>;
  onPlayPause: MockedFunction<() => void>;
  updateVolume: MockedFunction<(volume: number) => void>;
  updatePositionSlider: MockedFunction<(position: number) => void>;
  removeToPlaylist: MockedFunction<(index: number) => void>;
  switchRepeat: MockedFunction<() => void>;
  switchRandom: MockedFunction<() => void>;
  removeVideo: MockedFunction<(idVideo: string, callbackSuccess: () => void) => void>;
  onLoadListLogin: MockedFunction<
    (listPlaylist: UserPlaylist[], listFollow: FollowItem[], listLike: UserVideo[]) => void
  >;
  addNewPlaylist: MockedFunction<(idPlaylist: string, title: string) => void>;
  editPlaylistTitle: MockedFunction<(idPlaylist: string, title: string) => void>;
  switchVisibilityPlaylist: MockedFunction<(idPlaylist: string, isPrivate: boolean) => void>;
  deletePlaylist: MockedFunction<(idPlaylist: string) => void>;
  deleteFollow: MockedFunction<(idPlaylist: string) => void>;
  switchFollow: MockedFunction<
    (idPlaylist: string, title?: string, artist?: string, urlImage?: string) => void
  >;
  addVideoInPlaylist: MockedFunction<
    (key: string, artist: string, title: string, duration: number) => void
  >;
  addVideoInPlaylistRequest: MockedFunction<
    (
      idPlaylist: string,
      addKey: string,
      addTitle: string,
      addArtist: string,
      addDuration: number
    ) => void
  >;
  addInCurrentList: MockedFunction<(playlist: Video[], idTopCharts?: string | null) => void>;
  addVideoAfterCurrentInList: MockedFunction<(video: Video) => void>;
  runPlaylist: MockedFunction<
    (playlist: Video[], index: number, idTopCharts?: string | null) => void
  >;
  clearErrorMessage: MockedFunction<() => void>;

  // Properties
  tabIndexInitial: number[];
  tabIndex: number[];
  currentIndex: number;
  listVideo: Video[];
  isPlaying: boolean;
  currentTitle: string;
  currentArtist: string;
  currentKey: string;
  errorMessage$: Observable<string | null>;
}

/** Mock for InitService */
export interface MockInitService {
  getPing: MockedFunction<() => Observable<boolean>>;
  loginSuccess: MockedFunction<
    (
      pseudo: string,
      idPerso: string,
      mail: string,
      darkModeEnabled: boolean,
      language: string
    ) => void
  >;
  logOut: MockedFunction<() => void>;
  onMessageUnlog: MockedFunction<() => void>;
  getHomeInit: MockedFunction<() => Observable<{ top: unknown[]; top_albums: unknown[] }>>;
}

/** Mock for UserService */
export interface MockUserService {
  login: MockedFunction<(email: string, password: string) => Observable<LoginResponse>>;
  loginWithGoogle: MockedFunction<(credential: string) => Observable<LoginResponse>>;
  register: MockedFunction<
    (pseudo: string, email: string, password: string) => Observable<UserReponse>
  >;
  forgotPassword: MockedFunction<(email: string) => Observable<UserReponse>>;
  resetPassword: MockedFunction<
    (token: string, password: string) => Observable<{ success: boolean }>
  >;
  changePassword: MockedFunction<
    (oldPassword: string, newPassword: string) => Observable<UserReponse>
  >;
  deleteAccount: MockedFunction<(password: string) => Observable<UserReponse>>;
  updateSettings: MockedFunction<
    (darkModeEnabled: boolean, language: string) => Observable<UserReponse>
  >;
}

/** Mock for Meta */
export interface MockMetaService {
  updateTag: MockedFunction<(tag: { name?: string; property?: string; content: string }) => void>;
  addTag: MockedFunction<(tag: { name?: string; property?: string; content: string }) => void>;
  removeTag: MockedFunction<(attrSelector: string) => void>;
}

/** Mock for Router */
export interface MockRouter {
  navigate: MockedFunction<(commands: unknown[], extras?: unknown) => Promise<boolean>>;
  navigateByUrl: MockedFunction<(url: string) => Promise<boolean>>;
}

/** Mock for ChangeDetectorRef */
export interface MockChangeDetectorRef {
  detectChanges: MockedFunction<() => void>;
  markForCheck: MockedFunction<() => void>;
}

/** Mock for NgbModal */
export interface MockNgbModal {
  open: MockedFunction<(content: unknown, options?: unknown) => { result: Promise<unknown> }>;
}

/** Mock for NgbActiveModal */
export interface MockNgbActiveModal {
  close: MockedFunction<(result?: unknown) => void>;
  dismiss: MockedFunction<(reason?: unknown) => void>;
}

/** Mock for GoogleAnalyticsService */
export interface MockGoogleAnalyticsService {
  pageView: MockedFunction<(path: string, title?: string) => void>;
  event: MockedFunction<
    (action: string, category?: string, label?: string, value?: number) => void
  >;
}
