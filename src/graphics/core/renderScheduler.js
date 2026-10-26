export function createRenderScheduler({ render, requestFrame, cancelFrame }) {
  let pending = null;
  let disposed = false;
  let paused = false;
  let continuous = false;
  let dirty = false;
  let frames = 0;
  function schedule() {
    if (!disposed && !paused && pending === null && (dirty || continuous)) pending = requestFrame(tick);
  }
  function tick(timestamp) {
    pending = null;
    if (disposed || paused) return;
    dirty = false;
    frames += 1;
    render(timestamp);
    schedule();
  }
  return Object.freeze({
    invalidate() { dirty = true; schedule(); },
    setContinuous(value) { continuous = Boolean(value); schedule(); },
    setPaused(value) {
      paused = Boolean(value);
      if (paused && pending !== null) { cancelFrame(pending); pending = null; }
      schedule();
    },
    dispose() { disposed = true; if (pending !== null) cancelFrame(pending); pending = null; },
    snapshot: () => ({ pending: pending !== null, disposed, paused, continuous, frames }),
  });
}
