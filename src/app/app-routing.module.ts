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
  { path: 'like', component: PlaylistComponent },
  {
    path: 'artist',
    loadChildren: () => import('./routing/artist.module').then(m => m.ArtistModule)
  },
  {
    path: 'search/:query',
    loadChildren: () => import('./routing/search.module').then(m => m.SearchModule)

  },
  { path: 'help/:page', component: HelpPageComponent },
  { path: 'help', component: HelpComponent },
  { path: 'current', component: CurrentComponent },
  {
    path: 'settings',
    loadChildren: () => import('./routing/settings.module').then(m => m.SettingsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'my-playlists',
    loadChildren: () => import('./routing/my-playlists.module').then(m => m.MyPlaylistsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'my-selection',
    loadChildren: () => import('./routing/my-selection.module').then(m => m.MySelectionModule),
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
