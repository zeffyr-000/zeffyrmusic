import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ArtistComponent } from '../artist/artist.component';
import { TranslocoModule } from '@jsverse/transloco';
import { SharedModule } from './shared/shared.module';
import { ShareButtons } from 'ngx-sharebuttons/buttons';

const routes: Routes = [
    { path: ':id_artist', component: ArtistComponent }
];

@NgModule({
    declarations: [ArtistComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        TranslocoModule,
        ShareButtons,
        SharedModule
    ],
    exports: [RouterModule]
})
export class ArtistModule { }
