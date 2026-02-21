import { Directive, HostListener, output } from '@angular/core';

/** Maximum Y coordinate (in pixels) from the top of the screen to consider a touchstart as a potential pull-to-refresh gesture */
const PULL_TO_REFRESH_START_Y_THRESHOLD = 100;

/** Minimum Y distance (in pixels) required to trigger a swipe down event */
const SWIPE_DOWN_DISTANCE_THRESHOLD = -60;

@Directive({ selector: '[appSwipeDown]' })
export class SwipeDownDirective {
  readonly swipeDown = output<TouchEvent>();

  private startY = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.startY = event.touches[0].clientY;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    const currentY = event.touches[0].clientY;
    // If moving down from near the top, prevent default to stop pull-to-refresh
    if (
      this.startY < PULL_TO_REFRESH_START_Y_THRESHOLD &&
      currentY > this.startY &&
      event.cancelable
    ) {
      event.preventDefault();
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    const endY = event.changedTouches[0].clientY;
    if (this.startY - endY < SWIPE_DOWN_DISTANCE_THRESHOLD) {
      this.swipeDown.emit(event);
    }
  }
}
