export const QUERY_LIMITS = Object.freeze({
  directory: Object.freeze({ default: 24, maximum: 60 }),
  conversations: Object.freeze({ default: 30, maximum: 50 }),
  messages: Object.freeze({ default: 50, maximum: 100 }),
  supportTickets: Object.freeze({ default: 30, maximum: 50 }),
  ticketMessages: Object.freeze({ default: 50, maximum: 100 }),
  revisions: Object.freeze({ default: 20, maximum: 50 }),
  analyticsEvents: Object.freeze({ default: 40, maximum: 100 }),
});

export function boundedQueryLimit(resource, requested) {
  const policy = QUERY_LIMITS[resource];
  if (!policy) throw new Error(`Unknown query resource: ${resource}`);
  const value = Number(requested);
  if (!Number.isFinite(value)) return policy.default;
  return Math.min(policy.maximum, Math.max(1, Math.floor(value)));
}

export function queryPage(resource, { limit, cursor = null } = {}) {
  return Object.freeze({
    limit: boundedQueryLimit(resource, limit),
    cursor: cursor === null || cursor === undefined ? null : String(cursor).slice(0, 512),
  });
}

export function firestorePage(snapshot, size, { reverse = false } = {}) {
  const documents = snapshot.docs.slice(0, size);
  const items = documents.map((entry) => ({ id: entry.id, ...entry.data() }));
  if (reverse) items.reverse();
  return Object.freeze({
    items,
    cursor: documents.at(-1) || null,
    hasMore: snapshot.docs.length > size,
  });
}
