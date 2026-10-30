/** One requestAnimationFrame loop shared by homepage motion subscribers. */
export class FrameScheduler {
  constructor(
    request = (callback) => requestAnimationFrame(callback),
    cancel = (id) => cancelAnimationFrame(id),
  ) {
    this.request = request;
    this.cancel = cancel;
    this.callbacks = new Set();
    this.frame = 0;
    this.last = 0;
    this.tick = this.tick.bind(this);
  }

  subscribe(callback) {
    this.callbacks.add(callback);
    if (!this.frame) this.frame = this.request(this.tick);
    return () => {
      this.callbacks.delete(callback);
      if (!this.callbacks.size && this.frame) {
        this.cancel(this.frame);
        this.frame = 0;
      }
    };
  }

  tick(now) {
    this.frame = 0;
    const delta = this.last ? Math.min(64, now - this.last) : 16.67;
    this.last = now;
    this.callbacks.forEach((callback) => callback(now, delta));
    if (this.callbacks.size) this.frame = this.request(this.tick);
  }

  clear() {
    if (this.frame) this.cancel(this.frame);
    this.frame = 0;
    this.callbacks.clear();
  }
}

export const frameScheduler =
  typeof window === "undefined" ? null : new FrameScheduler();
