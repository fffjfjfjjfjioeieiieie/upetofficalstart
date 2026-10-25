export function studioPreviewEnabled(hostname, flag) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || flag === 'true';
}

export function hasFounderPreviewClaim(claims) {
  return claims?.founder === true
    || claims?.role === 'founder'
    || (Array.isArray(claims?.roles) && claims.roles.includes('founder'));
}

// A single coordinator owns all draft writes for one mounted Studio. Edits made
// during an in-flight save are sent afterwards with the newer draft revision.
export function createDraftSaveCoordinator({ save, onSaved = () => {}, onError = () => {}, delayMs = 800 }) {
  let pending = null;
  let timer = null;
  let inFlight = null;
  let disposed = false;

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  async function flush() {
    clearTimer();
    if (disposed) return;
    if (inFlight) {
      await inFlight;
      return pending ? flush() : undefined;
    }
    if (!pending) return;
    const value = pending;
    pending = null;
    inFlight = Promise.resolve().then(() => save(value)).then((result) => {
      if (!disposed) onSaved(result);
      return result;
    }).catch((error) => {
      if (!disposed) {
        pending ??= value;
        onError(error);
      }
      throw error;
    });
    try { await inFlight; }
    finally { inFlight = null; }
    return pending ? flush() : undefined;
  }

  function enqueue(value) {
    if (disposed) throw new Error('This Studio session has ended.');
    pending = value;
    clearTimer();
    timer = setTimeout(() => { void flush().catch(() => {}); }, delayMs);
  }

  function dispose() {
    disposed = true;
    pending = null;
    clearTimer();
  }

  return Object.freeze({ enqueue, flush, dispose, hasPending: () => Boolean(pending || inFlight) });
}
