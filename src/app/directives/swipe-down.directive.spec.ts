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
    spyOn(component, 'onSwipeDown');
    const emitSpy = spyOn(directive.swipeDown, 'emit').and.callThrough();

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

    const preventDefaultSpy = jasmine.createSpy('preventDefault');
    Object.defineProperty(touchStartEvent, 'preventDefault', {
      value: preventDefaultSpy,
      writable: true,
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

    const endPreventDefaultSpy = jasmine.createSpy('preventDefault');
    Object.defineProperty(touchEndEvent, 'preventDefault', {
      value: endPreventDefaultSpy,
      writable: true,
    });

    divEl.nativeElement.dispatchEvent(touchEndEvent);

    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalled();
    expect(component.onSwipeDown).toHaveBeenCalled();
  });
});
