import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TrendingComponent } from './trending/trending.component';
import { AuthGuard } from './services/auth-guard.service';
import { AdminGuard } from './services/admin-guard.service';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'trending', component: TrendingComponent },
  { path: 'top', component: HomeComponent },
  { path: 'albums', component: HomeComponent },
  {
    path: 'playlist/:id_playlist',
    loadComponent: () => import('./playlist/playlist.component').then(m => m.PlaylistComponent),
  },
  {
    path: 'top/:id',
    loadComponent: () => import('./playlist/playlist.component').then(m => m.PlaylistComponent),
  },
  {
    path: 'like',
    loadComponent: () => import('./playlist/playlist.component').then(m => m.PlaylistComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'artist/:id_artist',
    loadComponent: () => import('./artist/artist.component').then(m => m.ArtistComponent),
  },
  {
    path: 'search/:query',
    loadComponent: () => import('./search/search.component').then(m => m.SearchComponent),
  },
  {
    path: 'help/:page',
    loadComponent: () =>
      import('./help/help-page/help-page.component').then(m => m.HelpPageComponent),
  },
  {
    path: 'help',
    loadComponent: () => import('./help/help.component').then(m => m.HelpComponent),
  },
  {
    path: 'current',
    loadComponent: () => import('./current/current.component').then(m => m.CurrentComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'my-playlists',
    loadComponent: () =>
      import('./my-playlists/my-playlists.component').then(m => m.MyPlaylistsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'my-selection',
    loadComponent: () =>
      import('./my-selection/my-selection.component').then(m => m.MySelectionComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'reset_pass/:id_perso/:key',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AdminGuard],
    data: { noPreload: true },
  },
  {
    path: 'admin/merge-album',
    loadComponent: () =>
      import('./admin/merge-album/merge-album.component').then(m => m.MergeAlbumComponent),
    canActivate: [AdminGuard],
    data: { noPreload: true },
  },
  {
    path: 'admin/merge-artist',
    loadComponent: () =>
      import('./admin/merge-artist/merge-artist.component').then(m => m.MergeArtistComponent),
    canActivate: [AdminGuard],
    data: { noPreload: true },
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
