import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { QueueAnimationService } from '../services/queue-animation.service';

/**
 * FlyToQueueDirective - Triggers the "fly to queue" animation on click.
 *
 * Bind a video key string to `appFlyToQueue`. For a bulk add, also bind
 * `flyCount` so the flying ghost shows a "+N" badge. The host's own click
 * handler still performs the actual queue mutation.
 */
@Directive({ selector: '[appFlyToQueue]' })
export class FlyToQueueDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly queueAnimation = inject(QueueAnimationService);

  readonly videoKey = input<string>('', { alias: 'appFlyToQueue' });
  readonly flyCount = input<number>(1);

  @HostListener('click')
  onClick(): void {
    const videoKey = this.videoKey();
    if (videoKey) {
      this.queueAnimation.flyToQueue(this.host.nativeElement, videoKey, this.flyCount());
    }
  }
}
