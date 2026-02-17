import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserPlaylist } from '../models/playlist.model';
import { FollowItem } from '../models/follow.model';
import { UserVideo } from '../models/video.model';
import { UserDataStore } from '../store/user-data/user-data.store';

@Injectable({
  providedIn: 'root',
})
export class UserLibraryService {
  private readonly http = inject(HttpClient);
  private readonly userDataStore = inject(UserDataStore);

  initializeFromLogin(
    playlists: UserPlaylist[],
    follows: FollowItem[],
    likedVideos: UserVideo[]
  ): void {
    this.userDataStore.initialize({
      playlists,
      follows,
      likedVideos,
    });
  }

  resetOnLogout(): void {
    this.userDataStore.reset();
  }

  addPlaylist(idPlaylist: string, title: string): void {
    const playlist: UserPlaylist = {
      id_playlist: idPlaylist,
      titre: title,
      prive: false,
    };
    this.userDataStore.addPlaylist(playlist);
  }

  updatePlaylistTitle(idPlaylist: string, title: string): void {
    this.userDataStore.updatePlaylistTitle(idPlaylist, title);
  }

  togglePlaylistVisibility(idPlaylist: string, isPrivate: boolean): Observable<boolean> {
    const status = isPrivate ? 'prive' : 'public';

    return this.http
      .get<{
        success: boolean;
      }>(`${environment.URL_SERVER}switch_publique?id_playlist=${idPlaylist}&statut=${status}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.userDataStore.togglePlaylistVisibility(idPlaylist, isPrivate);
          }
        }),
        map(response => response.success),
        catchError(() => of(false))
      );
  }

  deletePlaylist(idPlaylist: string): Observable<boolean> {
    return this.http
      .get<{ success: boolean }>(`${environment.URL_SERVER}playlist-supprimer/${idPlaylist}`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.userDataStore.removePlaylist(idPlaylist);
          }
        }),
        map(response => response.success),
        catchError(() => of(false))
      );
  }

  toggleFollow(
    idPlaylist: string,
    title = '',
    artist = '',
    urlImage = ''
  ): Observable<{ success: boolean; isFollowing: boolean }> {
    return this.http
      .get<{
        success: boolean;
        est_suivi: boolean;
      }>(`${environment.URL_SERVER}switch_suivi/${idPlaylist}`)
      .pipe(
        tap(response => {
          if (response.success) {
            if (response.est_suivi) {
              this.userDataStore.addFollow({
                id_playlist: idPlaylist,
                titre: title,
                artiste: artist,
                url_image: urlImage,
              });
            } else {
              this.userDataStore.removeFollow(idPlaylist);
            }
          }
        }),
        map(response => ({ success: response.success, isFollowing: response.est_suivi })),
        catchError(() => of({ success: false, isFollowing: false }))
      );
  }

  removeFollow(idPlaylist: string): Observable<{ success: boolean; isFollowing: boolean }> {
    return this.toggleFollow(idPlaylist);
  }

  addLike(key: string): Observable<boolean> {
    return this.http
      .post<{ success: boolean; like: UserVideo }>(`${environment.URL_SERVER}add_like`, { key })
      .pipe(
        tap(response => {
          if (response.success && response.like) {
            this.userDataStore.likeVideo(response.like);
          }
        }),
        map(response => response.success),
        catchError(() => of(false))
      );
  }

  removeLike(key: string): Observable<boolean> {
    return this.http
      .post<{ success: boolean }>(`${environment.URL_SERVER}remove_like`, { key })
      .pipe(
        tap(response => {
          if (response.success) {
            this.userDataStore.unlikeVideo(key);
          }
        }),
        map(response => response.success),
        catchError(() => of(false))
      );
  }

  isLiked(key: string): boolean {
    return this.userDataStore.isLiked(key);
  }

  addVideoToPlaylist(
    idPlaylist: string,
    key: string,
    title: string,
    artist: string,
    duration: number
  ): Observable<boolean> {
    return this.http
      .post<{ success: boolean }>(`${environment.URL_SERVER}insert_video`, {
        id_playlist: idPlaylist,
        key,
        titre: title,
        artiste: artist,
        duree: duration,
      })
      .pipe(
        map(response => response.success),
        catchError(() => of(false))
      );
  }

  removeVideoFromPlaylist(idVideo: string): Observable<boolean> {
    return this.http
      .get<{ success: boolean }>(`${environment.URL_SERVER}supprimer/${idVideo}`)
      .pipe(
        map(response => response.success),
        catchError(() => of(false))
      );
  }

  reorderPlaylistTracks(idPlaylist: string, orderedVideoIds: string[]): Observable<boolean> {
    return this.http
      .post<{ success: boolean }>(`${environment.URL_SERVER}reorder_playlist`, {
        id_playlist: idPlaylist,
        ordered_ids: orderedVideoIds,
      })
      .pipe(
        map(response => response.success),
        catchError(() => of(false))
      );
  }

  reorderLikes(orderedKeys: string[]): Observable<boolean> {
    return this.http
      .post<{ success: boolean }>(`${environment.URL_SERVER}reorder_likes`, {
        ordered_keys: orderedKeys,
      })
      .pipe(
        map(response => response.success),
        catchError(() => of(false))
      );
  }
}
