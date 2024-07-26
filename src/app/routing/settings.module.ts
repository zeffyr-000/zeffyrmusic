import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from '../settings/settings.component';
import { SharedModule } from './shared/shared.module';
import { TranslocoModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
    { path: '', component: SettingsComponent }
];

@NgModule({
    declarations: [
        SettingsComponent
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
export class SettingsModule { }
