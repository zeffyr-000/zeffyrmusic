import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { HelpComponent } from './help/help.component';
import { HelpPageComponent } from './help/help-page/help-page.component';
import { CurrentComponent } from './current/current.component';
import { AuthGuard } from './services/auth-guard.service';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'top', component: HomeComponent },
  { path: 'albums', component: HomeComponent },
  { path: 'playlist/:id_playlist', component: PlaylistComponent },
  { path: 'top/:id', component: PlaylistComponent },
  { path: 'like', component: PlaylistComponent, canActivate: [AuthGuard] },
  {
    path: 'artist/:id_artist',
    loadComponent: () => import('./artist/artist.component').then(m => m.ArtistComponent)
  },
  {
    path: 'search/:query',
    loadComponent: () => import('./search/search.component').then(m => m.SearchComponent)

  },
  { path: 'help/:page', component: HelpPageComponent },
  { path: 'help', component: HelpComponent },
  { path: 'current', component: CurrentComponent },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'my-playlists',
    loadComponent: () => import('./my-playlists/my-playlists.component').then(m => m.MyPlaylistsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'my-selection',
    loadComponent: () => import('./my-selection/my-selection.component').then(m => m.MySelectionComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'reset_pass/:id_perso/:token',
    loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
