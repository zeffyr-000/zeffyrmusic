import { SwipeDownDirective } from './swipe-down.directive';
import { Component, DebugElement, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

@Component({
  template: `<div appSwipeDown (swipeDown)="onSwipeDown($event)"></div>`
})
class TestComponent {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSwipeDown(event: TouchEvent) { }
}

describe('SwipeDownDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let divEl: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SwipeDownDirective, TestComponent]
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    divEl = fixture.debugElement.query(By.css('div'));
  });

  it('should create an instance', () => {
    const el = { nativeElement: document.createElement('div') };
    const directive = new SwipeDownDirective(el as ElementRef);
    expect(directive).toBeTruthy();
  });

  it('should emit swipeDown event when swiped down', () => {
    spyOn(component, 'onSwipeDown');

    divEl.triggerEventHandler('touchstart', { touches: [{ clientY: 50 }] });
    divEl.triggerEventHandler('touchend', { changedTouches: [{ clientY: 200 }] });

    expect(component.onSwipeDown).toHaveBeenCalled();
  });
});