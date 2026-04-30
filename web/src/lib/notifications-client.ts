import { clientApiUrl } from "@/lib/apiBase";

export type NotificationEventItem = {
  id: string;
  eventType: "like" | "comment" | "save";
  createdAt: string;
  seenAt: string | null;
  actor: { id: string; name: string; avatar?: string } | null;
  summary: { id: string; title: string } | null;
};

export type NotificationGroupItem = {
  id: string;
  eventType: "like" | "comment" | "save";
  count: number;
  lastEventAt: string;
  seenAt: string | null;
  summary: { id: string; title: string } | null;
  actors: { id: string; name: string; avatar?: string }[];
};

export type NotificationsListResponse = {
  newEvents: NotificationEventItem[];
  olderGroups: NotificationGroupItem[];
};

export async function getUnreadCount(): Promise<number> {
  const res = await fetch(clientApiUrl("/api/notifications/unread-count"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as { unread?: number };
  return Number(data.unread ?? 0);
}

export async function getList(options?: {
  limit?: number;
  groupLimit?: number;
}): Promise<NotificationsListResponse> {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.groupLimit != null) params.set("groupLimit", String(options.groupLimit));
  const q = params.toString();
  const res = await fetch(
    `${clientApiUrl("/api/notifications/list")}${q ? `?${q}` : ""}`,
    { credentials: "include", cache: "no-store" },
  );
  if (!res.ok) return { newEvents: [], olderGroups: [] };
  return (await res.json()) as NotificationsListResponse;
}

export async function markSeen(): Promise<number> {
  const res = await fetch(clientApiUrl("/api/notifications/mark-seen"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as { unread?: number };
  return Number(data.unread ?? 0);
}

export function subscribeToNotificationsStream(handlers: {
  onUnread?: (unread: number) => void;
  onRefresh?: () => void;
  onError?: () => void;
}): { close: () => void } {
  const es = new EventSource(clientApiUrl("/api/notifications/stream"), {
    withCredentials: true,
  } as any);

  const onUnread = (e: MessageEvent) => {
    try {
      const data = JSON.parse(String(e.data)) as { unread?: number };
      handlers.onUnread?.(Number(data.unread ?? 0));
    } catch {
      // ignore
    }
  };

  const onRefresh = () => handlers.onRefresh?.();
  const onError = () => handlers.onError?.();

  es.addEventListener("unread", onUnread as any);
  es.addEventListener("refresh", onRefresh as any);
  es.addEventListener("error", onError as any);

  return { close: () => es.close() };
}

