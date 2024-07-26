import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToMMSSPipe } from 'src/app/pipes/to-mmss.pipe';
import { DefaultImageDirective } from 'src/app/directives/default-image.directive';
import { SwipeDownDirective } from 'src/app/directives/swipe-down.directive';
import { LazyLoadImageDirective } from 'src/app/directive/lazy-load-image.directive';

@NgModule({
  declarations: [
    ToMMSSPipe,
    SwipeDownDirective,
    DefaultImageDirective,
    LazyLoadImageDirective
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    ToMMSSPipe,
    SwipeDownDirective,
    DefaultImageDirective,
    LazyLoadImageDirective
  ]
})
export class SharedModule { }
