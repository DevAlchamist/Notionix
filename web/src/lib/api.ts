import { serverApiUrl } from "@/lib/apiBase";

export type SummaryListItem = {
  id: string;
  title: string;
  platform: string;
  createdAt: string;
  preview?: string;
  tags?: Array<{ _id?: string; name?: string; color?: string }>;
  starred?: boolean;
  workspaceId?: string | null;
  visibility?: "public" | "private";
};

export type SummaryDetail = SummaryListItem & {
  summaryText: string;
  url: string;
  visibility?: "public" | "private";
  ownerId?: string;
};

type MeResponse = { id: string; email: string; name: string; avatar?: string };

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function pickId(value: unknown): string {
  const obj = asObject(value);
  const id = obj.id ?? obj._id;
  return typeof id === "string" ? id : "";
}

function mapSummaryListItem(raw: unknown): SummaryListItem | null {
  const obj = asObject(raw);
  const id = pickId(obj);
  if (!id) return null;
  return {
    id,
    title: String(obj.title ?? ""),
    platform: String(obj.platform ?? "Unknown"),
    createdAt: String(obj.createdAt ?? new Date().toISOString()),
    preview: String(obj.preview ?? obj.summaryText ?? ""),
    tags: Array.isArray(obj.tags)
      ? obj.tags.map((tag) => {
          const t = asObject(tag);
          return {
            _id: t._id == null ? undefined : String(t._id),
            name: t.name == null ? undefined : String(t.name),
            color: t.color == null ? undefined : String(t.color),
          };
        })
      : [],
    starred: obj.starred === true,
    workspaceId: obj.workspaceId == null ? null : String(obj.workspaceId),
    visibility: obj.visibility === "public" ? "public" : "private",
  };
}

function mapSummaryDetail(raw: unknown): SummaryDetail | null {
  const base = mapSummaryListItem(raw);
  if (!base) return null;
  const obj = asObject(raw);
  return {
    ...base,
    summaryText: String(obj.summaryText ?? ""),
    url: String(obj.url ?? ""),
    ownerId: obj.ownerId == null ? undefined : String(obj.ownerId),
  };
}

async function getServerCookieHeader(): Promise<string | undefined> {
  try {
    const { cookies } = await import("next/headers");
    // Next.js 15 requires awaiting cookies()
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    if (allCookies.length === 0) return undefined;
    return allCookies.map(c => `${c.name}=${c.value}`).join("; ");
  } catch (error) {
    const msg = String((error as Error)?.message ?? error);
    if (!msg.includes("Dynamic server usage")) {
      console.error("Cookie extract error:", error);
    }
    return undefined;
  }
}

export async function fetchSummaries(): Promise<SummaryListItem[]> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(await serverApiUrl("/api/summaries"), {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      // ignore - body may be unreadable
    }
    console.warn("Failed to load summaries", {
      status: res.status,
      body: bodyText.slice(0, 200),
    });
    // For dashboard server-rendering: keep the UI usable even if the API
    // is down or auth cookies are missing/invalid.
    return [];
  }
  const data = asObject(await res.json());
  const items = Array.isArray(data.items) ? data.items : [];
  return items
    .map(mapSummaryListItem)
    .filter((item: SummaryListItem | null): item is SummaryListItem => item !== null);
}

export async function fetchSummary(id: string): Promise<SummaryDetail | null> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(await serverApiUrl(`/api/summaries/${id}`), {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      // ignore - body may be unreadable
    }
    console.warn("Failed to load summary", {
      id,
      status: res.status,
      body: bodyText.slice(0, 200),
    });
    return null;
  }
  const data = await res.json();
  return mapSummaryDetail(data);
}

export type WorkspaceTag = { _id?: string; id?: string; name?: string; color?: string };

export type WorkspaceSummaryListItem = SummaryListItem & {
  preview?: string;
  url?: string;
};

export type WorkspaceDetail = {
  id: string;
  name: string;
  description?: string;
  tags?: WorkspaceTag[];
  createdAt?: string;
  starred?: boolean;
  summaryCount?: number;
  summariesLength?: number;
  summaries: WorkspaceSummaryListItem[];
};

export async function fetchWorkspaceDetail(id: string): Promise<WorkspaceDetail | null> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(await serverApiUrl(`/api/workspaces/${encodeURIComponent(id)}`), {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to load workspace");
  }
  const data = asObject(await res.json());
  const summariesRaw = Array.isArray(data.summaries) ? data.summaries : [];
  const summaries: WorkspaceSummaryListItem[] = [];
  for (const raw of summariesRaw) {
    const item = mapSummaryListItem(raw);
    if (!item) continue;
    const obj = asObject(raw);
    summaries.push({
      ...item,
      preview: obj.preview == null ? undefined : String(obj.preview),
      url: obj.url == null ? undefined : String(obj.url),
    });
  }

  return {
    id: pickId(data),
    name: String(data.name ?? ""),
    description: data.description == null ? undefined : String(data.description),
    tags: Array.isArray(data.tags) ? (data.tags as WorkspaceTag[]) : [],
    createdAt: data.createdAt == null ? undefined : String(data.createdAt),
    starred: data.starred === true,
    summaryCount: typeof data.summaryCount === "number" ? data.summaryCount : summaries.length,
    summariesLength: typeof data.summariesLength === "number" ? data.summariesLength : summaries.length,
    summaries,
  };
}

export async function fetchMe() {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(await serverApiUrl("/api/me"), {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as MeResponse;
}

export type NotificationActor = { id: string; name: string; avatar?: string } | null;
export type NotificationSummaryRef = { id: string; title: string } | null;

export type NotificationEventItem = {
  id: string;
  eventType: "like" | "comment" | "save";
  createdAt: string;
  seenAt: string | null;
  actor: NotificationActor;
  summary: NotificationSummaryRef;
};

export type NotificationGroupItem = {
  id: string;
  eventType: "like" | "comment" | "save";
  count: number;
  lastEventAt: string;
  seenAt: string | null;
  summary: NotificationSummaryRef;
  actors: { id: string; name: string; avatar?: string }[];
};

export type NotificationsListResponse = {
  newEvents: NotificationEventItem[];
  olderGroups: NotificationGroupItem[];
};

export async function fetchNotificationsUnreadCount(): Promise<{ unread: number }> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(await serverApiUrl("/api/notifications/unread-count"), {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) return { unread: 0 };
  return (await res.json()) as { unread: number };
}

export async function fetchNotificationsList(options?: {
  limit?: number;
  groupLimit?: number;
}): Promise<NotificationsListResponse> {
  const cookieHeader = await getServerCookieHeader();
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.groupLimit != null) params.set("groupLimit", String(options.groupLimit));
  const q = params.toString();
  const url = `${await serverApiUrl("/api/notifications/list")}${q ? `?${q}` : ""}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) return { newEvents: [], olderGroups: [] };
  return (await res.json()) as NotificationsListResponse;
}

export async function markNotificationsSeen(): Promise<{ ok: true; unread: number }> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(await serverApiUrl("/api/notifications/mark-seen"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) return { ok: true, unread: 0 };
  return (await res.json()) as { ok: true; unread: number };
}

export async function enableSummaryShare(id: string): Promise<boolean> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(await serverApiUrl(`/api/summaries/${encodeURIComponent(id)}/share`), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({ enabled: true }),
    cache: "no-store",
  });
  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      // ignore
    }
    console.warn("Failed to enable summary share", {
      id,
      status: res.status,
      body: bodyText.slice(0, 200),
    });
    return false;
  }
  return true;
}

export async function fetchSharedSummary(id: string): Promise<SummaryDetail | null> {
  const res = await fetch(await serverApiUrl(`/api/shared/summaries/${encodeURIComponent(id)}`), {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return mapSummaryDetail(data);
}

/** Public social feed (all users’ visibility: public summaries). */
export type SocialAuthor = { id: string; name: string; avatar?: string };

export type WorkspaceTagLike = { _id?: string; name?: string; color?: string };

export type SocialFeedItem = {
  id: string;
  title: string;
  platform: string;
  preview: string;
  summaryText: string;
  url: string;
  createdAt: string;
  author: SocialAuthor;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  ownerId?: string;
};

export type SocialFeedResponse = { items: SocialFeedItem[]; hasMore: boolean };

export type SocialSummaryDetail = SocialFeedItem & {
  tags?: WorkspaceTagLike[];
};

export type SocialSavedItem = SocialFeedItem & { bookmarkedAt: string };

export type SocialSavedResponse = { items: SocialSavedItem[]; hasMore: boolean };

export async function fetchSocialFeed(options?: {
  limit?: number;
  skip?: number;
}): Promise<SocialFeedResponse> {
  const cookieHeader = await getServerCookieHeader();
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.skip != null) params.set("skip", String(options.skip));
  const q = params.toString();
  const url = `${await serverApiUrl("/api/social/feed")}${q ? `?${q}` : ""}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn("Failed to load social feed", res.status);
    return { items: [], hasMore: false };
  }
  const data = asObject(await res.json());
  const items = Array.isArray(data.items) ? data.items : [];
  return {
    items: items.map((raw) => {
      const obj = asObject(raw);
      return {
        id: pickId(obj),
        title: String(obj.title ?? ""),
        platform: String(obj.platform ?? "Unknown"),
        preview: String(obj.preview ?? ""),
        summaryText: String(obj.summaryText ?? ""),
        url: String(obj.url ?? ""),
        createdAt: String(obj.createdAt ?? new Date().toISOString()),
        author: asObject(obj.author) as SocialAuthor,
        likeCount: typeof obj.likeCount === "number" ? obj.likeCount : 0,
        commentCount: typeof obj.commentCount === "number" ? obj.commentCount : 0,
        likedByMe: obj.likedByMe === true,
        savedByMe: obj.savedByMe === true,
        ownerId: obj.ownerId == null ? undefined : String(obj.ownerId),
      };
    }),
    hasMore: data.hasMore === true,
  };
}

export async function fetchSocialSummary(id: string): Promise<SocialSummaryDetail | null> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(await serverApiUrl(`/api/social/summaries/${encodeURIComponent(id)}`), {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = asObject(await res.json());
  return {
    id: pickId(data),
    title: String(data.title ?? ""),
    platform: String(data.platform ?? "Unknown"),
    preview: String(data.preview ?? ""),
    summaryText: String(data.summaryText ?? ""),
    url: String(data.url ?? ""),
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    author: asObject(data.author) as SocialAuthor,
    likeCount: typeof data.likeCount === "number" ? data.likeCount : 0,
    commentCount: typeof data.commentCount === "number" ? data.commentCount : 0,
    likedByMe: data.likedByMe === true,
    savedByMe: data.savedByMe === true,
    ownerId: data.ownerId == null ? undefined : String(data.ownerId),
    tags: Array.isArray(data.tags) ? (data.tags as WorkspaceTagLike[]) : [],
  };
}

export async function fetchSocialSaved(options?: {
  limit?: number;
  skip?: number;
}): Promise<SocialSavedResponse> {
  const cookieHeader = await getServerCookieHeader();
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.skip != null) params.set("skip", String(options.skip));
  const q = params.toString();
  const url = `${await serverApiUrl("/api/social/saved")}${q ? `?${q}` : ""}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn("Failed to load social saved", res.status);
    return { items: [], hasMore: false };
  }
  const data = asObject(await res.json());
  const items = Array.isArray(data.items) ? data.items : [];
  return {
    items: items.map((raw) => {
      const obj = asObject(raw);
      return {
        id: pickId(obj),
        title: String(obj.title ?? ""),
        platform: String(obj.platform ?? "Unknown"),
        preview: String(obj.preview ?? ""),
        summaryText: String(obj.summaryText ?? ""),
        url: String(obj.url ?? ""),
        createdAt: String(obj.createdAt ?? new Date().toISOString()),
        author: asObject(obj.author) as SocialAuthor,
        likeCount: typeof obj.likeCount === "number" ? obj.likeCount : 0,
        commentCount: typeof obj.commentCount === "number" ? obj.commentCount : 0,
        likedByMe: obj.likedByMe === true,
        savedByMe: obj.savedByMe === true,
        bookmarkedAt: String(obj.bookmarkedAt ?? obj.createdAt ?? new Date().toISOString()),
        ownerId: obj.ownerId == null ? undefined : String(obj.ownerId),
      };
    }),
    hasMore: data.hasMore === true,
  };
}

