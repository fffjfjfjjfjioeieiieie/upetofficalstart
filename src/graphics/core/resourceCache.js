export function createGraphicsResourceCache() {
  const entries = new Map();
  let disposed = false;
  return {
    acquire(key, create) {
      if (disposed) throw new Error('Graphics resources are disposed.');
      let entry = entries.get(key);
      if (!entry) { entry = { value: create(), references: 0 }; entries.set(key, entry); }
      entry.references += 1;
      let released = false;
      return {
        value: entry.value,
        release() {
          if (released) return;
          released = true;
          entry.references -= 1;
          if (entry.references === 0 && entries.get(key) === entry) { entries.delete(key); entry.value.dispose?.(); }
        },
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const values = [...entries.values()];
      entries.clear();
      for (const entry of values) { try { entry.value.dispose?.(); } catch { /* Release the remaining resources too. */ } }
    },
    snapshot: () => ({ entries: entries.size, references: [...entries.values()].reduce((count, entry) => count + entry.references, 0) }),
  };
}

export function createGraphicsResourceScope(cache) {
  const resources = new Set();
  const leases = [];
  let disposed = false;
  return {
    own(resource) {
      if (disposed) throw new Error('Graphics resource scope is disposed.');
      resources.add(resource);
      return resource;
    },
    shared(key, create) {
      if (disposed) throw new Error('Graphics resource scope is disposed.');
      const lease = cache.acquire(key, create);
      leases.push(lease);
      return lease.value;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const resource of resources) { try { resource.dispose?.(); } catch { /* Keep releasing sibling allocations. */ } }
      for (const lease of leases) { try { lease.release(); } catch { /* Keep releasing sibling leases. */ } }
      resources.clear();
      leases.length = 0;
    },
  };
}
