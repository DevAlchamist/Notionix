export type SSEClient = {
  write: (chunk: string) => void;
};

const clientsByOwner = new Map<string, Set<SSEClient>>();

function getSet(ownerId: string): Set<SSEClient> {
  const existing = clientsByOwner.get(ownerId);
  if (existing) return existing;
  const created = new Set<SSEClient>();
  clientsByOwner.set(ownerId, created);
  return created;
}

export function sseAddClient(ownerId: string, client: SSEClient) {
  getSet(ownerId).add(client);
}

export function sseRemoveClient(ownerId: string, client: SSEClient) {
  const set = clientsByOwner.get(ownerId);
  if (!set) return;
  set.delete(client);
  if (set.size === 0) clientsByOwner.delete(ownerId);
}

function sseSend(client: SSEClient, event: string, data: unknown) {
  client.write(`event: ${event}\n`);
  client.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function ssePublish(ownerId: string, message: { unread?: number; refresh?: boolean }) {
  const set = clientsByOwner.get(ownerId);
  if (!set || set.size === 0) return;
  for (const client of set) {
    try {
      if (message.unread !== undefined) {
        sseSend(client, "unread", { unread: message.unread });
      }
      if (message.refresh) {
        sseSend(client, "refresh", {});
      }
    } catch {
      // Ignore write errors; cleanup happens on abort.
    }
  }
}
