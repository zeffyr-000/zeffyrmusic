import { Directive, HostListener, output } from '@angular/core';

@Directive({ selector: '[appSwipeDown]' })
export class SwipeDownDirective {
  readonly swipeDown = output<TouchEvent>();

  private startY = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.startY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    const endY = event.changedTouches[0].clientY;
    if (this.startY - endY < -60) {
      this.swipeDown.emit(event);
    }
  }
}
