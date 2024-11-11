import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from './shared/shared.module';
import { TranslocoModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { MySelectionComponent } from '../my-selection/my-selection.component';

const routes: Routes = [
    { path: '', component: MySelectionComponent }
];

@NgModule({
    declarations: [
        MySelectionComponent
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
export class MySelectionModule { }