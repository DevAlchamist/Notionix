const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function fetchMeClient(): Promise<{ id: string; email: string; name: string; avatar?: string } | null> {
  const res = await fetch(`${API_BASE_URL}/api/me`, { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export type SocialCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; avatar?: string };
  userId: string;
};

export type SocialCommentsResponse = { items: SocialCommentItem[]; hasMore: boolean };

export async function socialPostLike(summaryId: string): Promise<{ liked: true; likeCount: number }> {
  const res = await fetch(
    `${API_BASE_URL}/api/social/summaries/${encodeURIComponent(summaryId)}/like`,
    { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } },
  );
  if (!res.ok) throw new Error("Failed to like");
  return res.json();
}

export async function socialDeleteLike(summaryId: string): Promise<{ liked: false; likeCount: number }> {
  const res = await fetch(
    `${API_BASE_URL}/api/social/summaries/${encodeURIComponent(summaryId)}/like`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to unlike");
  return res.json();
}

export async function socialPostSave(summaryId: string): Promise<{ saved: true }> {
  const res = await fetch(
    `${API_BASE_URL}/api/social/summaries/${encodeURIComponent(summaryId)}/save`,
    { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } },
  );
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

export async function socialDeleteSave(summaryId: string): Promise<{ saved: false }> {
  const res = await fetch(
    `${API_BASE_URL}/api/social/summaries/${encodeURIComponent(summaryId)}/save`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to remove save");
  return res.json();
}

export async function socialFetchComments(
  summaryId: string,
  options?: { limit?: number; skip?: number },
): Promise<SocialCommentsResponse> {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.skip != null) params.set("skip", String(options.skip));
  const q = params.toString();
  const res = await fetch(
    `${API_BASE_URL}/api/social/summaries/${encodeURIComponent(summaryId)}/comments${q ? `?${q}` : ""}`,
    { credentials: "include", cache: "no-store" },
  );
  if (!res.ok) throw new Error("Failed to load comments");
  return res.json();
}

export async function socialPostComment(summaryId: string, body: string): Promise<SocialCommentItem> {
  const res = await fetch(
    `${API_BASE_URL}/api/social/summaries/${encodeURIComponent(summaryId)}/comments`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) throw new Error("Failed to post comment");
  return res.json();
}

export async function socialDeleteComment(
  summaryId: string,
  commentId: string,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/api/social/summaries/${encodeURIComponent(summaryId)}/comments/${encodeURIComponent(commentId)}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to delete comment");
}
