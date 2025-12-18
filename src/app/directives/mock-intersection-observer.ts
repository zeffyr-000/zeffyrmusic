export class MockIntersectionObserver implements IntersectionObserver {
  private callback: IntersectionObserverCallback;
  public root: Element | null = null;
  public rootMargin = '0px';
  public thresholds: readonly number[] = [0];

  constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
    this.callback = callback;
  }

  observe(target: Element) {
    // Simulate the intersection
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unobserve(target: Element) {
    // No-op
  }

  disconnect() {
    // No-op
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  triggerObserverCallback(entries: IntersectionObserverEntry[]): void {
    this.callback(entries, this);
  }
}
