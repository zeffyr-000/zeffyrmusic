import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArtistComponent } from './artist/artist.component';
import { HomeComponent } from './home/home.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { SearchComponent } from './search/search.component';
import { HelpComponent } from './help/help.component';
import { HelpPageComponent } from './help/help-page/help-page.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'playlist/:id_playlist', component: PlaylistComponent },
  { path: 'top/:id', component: PlaylistComponent },
  { path: 'like', component: PlaylistComponent },
  { path: 'artist/:id_artist', component: ArtistComponent },
  { path: 'search/:query', component: SearchComponent },
  { path: 'help/:page', component: HelpPageComponent },
  { path: 'help', component: HelpComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
