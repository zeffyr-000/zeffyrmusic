import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SearchComponent } from '../search/search.component';
import { SharedModule } from './shared/shared.module';
import { TranslocoModule } from '@jsverse/transloco';

const routes: Routes = [
  { path: '', component: SearchComponent }
];

@NgModule({
  declarations: [
    SearchComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslocoModule,
    SharedModule
  ],
  exports: [RouterModule]
})
export class SearchModule { }
