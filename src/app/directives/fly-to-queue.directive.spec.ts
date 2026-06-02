import { describe, it, expect, beforeEach, vi, type MockedObject } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { FlyToQueueDirective } from './fly-to-queue.directive';
import { QueueAnimationService } from '../services/queue-animation.service';

@Component({
  imports: [FlyToQueueDirective],
  template: `<button class="add" [appFlyToQueue]="videoKey()" [flyCount]="count()">add</button>`,
})
class HostComponent {
  readonly videoKey = signal('abc123');
  readonly count = signal(1);
}

describe('FlyToQueueDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let animationMock: MockedObject<QueueAnimationService>;

  beforeEach(async () => {
    animationMock = {
      flyToQueue: vi.fn(),
    } as unknown as MockedObject<QueueAnimationService>;

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: QueueAnimationService, useValue: animationMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should call flyToQueue with the video key on click', () => {
    const button = fixture.nativeElement.querySelector('.add') as HTMLButtonElement;

    button.click();

    expect(animationMock.flyToQueue).toHaveBeenCalledWith(button, 'abc123', 1);
  });

  it('should forward the fly count for a bulk add', () => {
    fixture.componentInstance.count.set(12);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.add') as HTMLButtonElement;

    button.click();

    expect(animationMock.flyToQueue).toHaveBeenCalledWith(button, 'abc123', 12);
  });

  it('should do nothing when the key is empty', () => {
    fixture.componentInstance.videoKey.set('');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.add') as HTMLButtonElement;

    button.click();

    expect(animationMock.flyToQueue).not.toHaveBeenCalled();
  });
});
