import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefaultImageDirective } from './default-image.directive';
import { By } from '@angular/platform-browser';

@Component({
  template: `<img src="url/image/invalide.jpg" alt="" appDefaultImage>`
})
class TestComponent { }

describe('DefaultImageDirective', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let imgEl: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestComponent, DefaultImageDirective]
    });
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    imgEl = fixture.debugElement.query(By.css('img'));
    fixture.detectChanges();
  });

  it('should not replace src if the image is valid', () => {
    const src = 'url/image/valid.jpg';

    imgEl.nativeElement.src = src;
    imgEl.triggerEventHandler('error', null);
    fixture.detectChanges();
    expect(imgEl.nativeElement.src).toContain(src);
  });
});