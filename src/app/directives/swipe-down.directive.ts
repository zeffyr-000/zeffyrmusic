import { Directive, Output, EventEmitter, ElementRef, HostListener, inject } from '@angular/core';

@Directive({ selector: '[appSwipeDown]' })
export class SwipeDownDirective {
  private el = inject(ElementRef);

  @Output() swipeDown = new EventEmitter();

  private startY: number;

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