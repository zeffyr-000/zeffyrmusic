import { SwipeDownDirective } from './swipe-down.directive';
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

@Component({
  imports: [SwipeDownDirective],
  template: `<div appSwipeDown (swipeDown)="onSwipeDown($event)"></div>`,
})
class TestComponent {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSwipeDown(event: TouchEvent) {
    // Test method stub
  }
}

describe('SwipeDownDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let divEl: DebugElement;
  let directive: SwipeDownDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent, SwipeDownDirective],
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    divEl = fixture.debugElement.query(By.css('div'));
    directive = divEl.injector.get(SwipeDownDirective);
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should emit swipeDown event when swiped down', () => {
    vi.spyOn(component, 'onSwipeDown');
    const emitSpy = vi.spyOn(directive.swipeDown, 'emit');

    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [
        new Touch({
          identifier: 0,
          target: divEl.nativeElement,
          clientX: 100,
          clientY: 50,
        }),
      ],
    });

    divEl.nativeElement.dispatchEvent(touchStartEvent);

    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [
        new Touch({
          identifier: 0,
          target: divEl.nativeElement,
          clientX: 100,
          clientY: 250,
        }),
      ],
    });

    divEl.nativeElement.dispatchEvent(touchEndEvent);

    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
    expect(component.onSwipeDown).toHaveBeenCalled();
  });

  describe('touchmove behavior', () => {
    it('should call preventDefault when moving down from near the top and event is cancelable', () => {
      // Simulate touchstart near the top
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({ identifier: 0, target: divEl.nativeElement, clientX: 100, clientY: 50 }),
        ],
      });
      divEl.nativeElement.dispatchEvent(touchStartEvent);

      // Simulate touchmove downwards
      const touchMoveEvent = new TouchEvent('touchmove', {
        cancelable: true,
        touches: [
          new Touch({ identifier: 0, target: divEl.nativeElement, clientX: 100, clientY: 150 }),
        ],
      });
      const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault');

      divEl.nativeElement.dispatchEvent(touchMoveEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should NOT call preventDefault when moving down but event is NOT cancelable', () => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({ identifier: 0, target: divEl.nativeElement, clientX: 100, clientY: 50 }),
        ],
      });
      divEl.nativeElement.dispatchEvent(touchStartEvent);

      const touchMoveEvent = new TouchEvent('touchmove', {
        cancelable: false,
        touches: [
          new Touch({ identifier: 0, target: divEl.nativeElement, clientX: 100, clientY: 150 }),
        ],
      });
      const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault');

      divEl.nativeElement.dispatchEvent(touchMoveEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should NOT call preventDefault when moving upwards', () => {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({ identifier: 0, target: divEl.nativeElement, clientX: 100, clientY: 150 }),
        ],
      });
      divEl.nativeElement.dispatchEvent(touchStartEvent);

      const touchMoveEvent = new TouchEvent('touchmove', {
        cancelable: true,
        touches: [
          new Touch({ identifier: 0, target: divEl.nativeElement, clientX: 100, clientY: 50 }),
        ],
      });
      const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault');

      divEl.nativeElement.dispatchEvent(touchMoveEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should NOT call preventDefault when starting touch is NOT near the top', () => {
      // Simulate touchstart far from the top (e.g., middle of screen)
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({ identifier: 0, target: divEl.nativeElement, clientX: 100, clientY: 200 }),
        ],
      });
      divEl.nativeElement.dispatchEvent(touchStartEvent);

      // Simulate touchmove downwards
      const touchMoveEvent = new TouchEvent('touchmove', {
        cancelable: true,
        touches: [
          new Touch({ identifier: 0, target: divEl.nativeElement, clientX: 100, clientY: 300 }),
        ],
      });
      const preventDefaultSpy = vi.spyOn(touchMoveEvent, 'preventDefault');

      divEl.nativeElement.dispatchEvent(touchMoveEvent);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });
});
