export class MockIntersectionObserver implements IntersectionObserver {
    private callback: IntersectionObserverCallback;
    public root: Element | null = null;
    public rootMargin: string = '0px';
    public thresholds: ReadonlyArray<number> = [0];

    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
    }

    observe(target: Element) {
        // Simulate the intersection
        this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
    }

    unobserve() {
        // No-op
    }

    disconnect() {
        // No-op
    }

    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
}