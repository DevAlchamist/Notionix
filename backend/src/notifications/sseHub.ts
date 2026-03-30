import type express from "express";

type SSEClient = express.Response;

const clientsByOwner = new Map<string, Set<SSEClient>>();

function getSet(ownerId: string): Set<SSEClient> {
  const existing = clientsByOwner.get(ownerId);
  if (existing) return existing;
  const created = new Set<SSEClient>();
  clientsByOwner.set(ownerId, created);
  return created;
}

export function sseAddClient(ownerId: string, res: SSEClient) {
  getSet(ownerId).add(res);
}

export function sseRemoveClient(ownerId: string, res: SSEClient) {
  const set = clientsByOwner.get(ownerId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clientsByOwner.delete(ownerId);
}

function sseSend(res: SSEClient, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function ssePublish(ownerId: string, message: { unread?: number; refresh?: boolean }) {
  const set = clientsByOwner.get(ownerId);
  if (!set || set.size === 0) return;
  for (const res of set) {
    try {
      if (message.unread !== undefined) {
        sseSend(res, "unread", { unread: message.unread });
      }
      if (message.refresh) {
        sseSend(res, "refresh", {});
      }
    } catch {
      // Ignore write errors; cleanup happens on close handlers.
    }
  }
}

