import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { TranslocoModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { MyPlaylistsComponent } from '../my-playlists/my-playlists.component';

const routes: Routes = [
    { path: '', component: MyPlaylistsComponent }
];

@NgModule({
    declarations: [
        MyPlaylistsComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        TranslocoModule,
        SharedModule,
        FormsModule,
    ],
    exports: [RouterModule]
})
export class MyPlaylistsModule { }