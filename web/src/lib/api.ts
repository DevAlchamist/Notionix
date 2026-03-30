const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export type SummaryListItem = {
  id: string;
  title: string;
  platform: string;
  createdAt: string;
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

async function getServerCookieHeader(): Promise<string | undefined> {
  try {
    const { cookies } = await import("next/headers");
    // Next.js 15 requires awaiting cookies()
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    if (allCookies.length === 0) return undefined;
    return allCookies.map(c => `${c.name}=${c.value}`).join("; ");
  } catch (error) {
    console.error("Cookie extract error:", error);
    return undefined;
  }
}

export async function fetchSummaries(): Promise<SummaryListItem[]> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(`${API_BASE_URL}/api/summaries`, {
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
  const data = await res.json();
  return data.items ?? [];
}

export async function fetchSummary(id: string): Promise<SummaryDetail | null> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(`${API_BASE_URL}/api/summaries/${id}`, {
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
  return data as SummaryDetail;
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
  const res = await fetch(`${API_BASE_URL}/api/workspaces/${encodeURIComponent(id)}`, {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to load workspace");
  }
  const data = await res.json();
  return data as WorkspaceDetail;
}

export async function fetchMe() {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(`${API_BASE_URL}/api/me`, {
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
  const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
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
  const url = `${API_BASE_URL}/api/notifications/list${q ? `?${q}` : ""}`;
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
  const res = await fetch(`${API_BASE_URL}/api/notifications/mark-seen`, {
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
  const res = await fetch(`${API_BASE_URL}/api/summaries/${encodeURIComponent(id)}/share`, {
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
  const res = await fetch(`${API_BASE_URL}/api/shared/summaries/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data as SummaryDetail;
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
  const url = `${API_BASE_URL}/api/social/feed${q ? `?${q}` : ""}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn("Failed to load social feed", res.status);
    return { items: [], hasMore: false };
  }
  const data = await res.json();
  return data as SocialFeedResponse;
}

export async function fetchSocialSummary(id: string): Promise<SocialSummaryDetail | null> {
  const cookieHeader = await getServerCookieHeader();
  const res = await fetch(`${API_BASE_URL}/api/social/summaries/${encodeURIComponent(id)}`, {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data as SocialSummaryDetail;
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
  const url = `${API_BASE_URL}/api/social/saved${q ? `?${q}` : ""}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn("Failed to load social saved", res.status);
    return { items: [], hasMore: false };
  }
  const data = await res.json();
  return data as SocialSavedResponse;
}

