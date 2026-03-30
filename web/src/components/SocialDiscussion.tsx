"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMeClient,
  socialDeleteComment,
  socialFetchComments,
  socialPostComment,
  type SocialCommentItem,
} from "@/lib/social-client";

function formatAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const d = Date.now() - t;
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

type SocialDiscussionProps = {
  summaryId: string;
  summaryOwnerId: string;
};

export function SocialDiscussion({ summaryId, summaryOwnerId }: SocialDiscussionProps) {
  const [meId, setMeId] = useState<string | null>(null);
  const [comments, setComments] = useState<SocialCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    const data = await socialFetchComments(summaryId, { limit: 100 });
    setComments(data.items);
  }, [summaryId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMeClient();
      if (!cancelled) setMeId(me?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await socialFetchComments(summaryId, { limit: 100 });
        if (!cancelled) setComments(data.items);
      } catch {
        if (!cancelled) setError("Could not load comments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [summaryId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = body.trim();
    if (!t || posting) return;
    setPosting(true);
    setError(null);
    try {
      const c = await socialPostComment(summaryId, t);
      setComments((prev) => [...prev, c]);
      setBody("");
    } catch {
      setError("Could not post comment.");
    } finally {
      setPosting(false);
    }
  }

  async function onDelete(commentId: string) {
    try {
      await socialDeleteComment(summaryId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setError("Could not delete comment.");
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        Discussion ({comments.length})
      </h2>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <label htmlFor="social-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="social-comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share a thought or question…"
          rows={3}
          maxLength={2000}
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 focus:border-notionix-primary focus:outline-none focus:ring-2 focus:ring-notionix-primary/20"
        />
        <div className="flex items-center justify-between gap-3">
          {error ? <p className="text-[13px] font-medium text-red-600">{error}</p> : <span />}
          <button
            type="submit"
            disabled={!body.trim() || posting}
            className="rounded-full bg-[#283593] px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1e2766] disabled:opacity-50"
          >
            {posting ? "Posting…" : "Comment"}
          </button>
        </div>
      </form>

      <ul className="mt-6 space-y-4">
        {loading ? (
          <li className="text-[14px] text-slate-500">Loading comments…</li>
        ) : comments.length === 0 ? (
          <li className="text-[14px] text-slate-500">No comments yet. Be the first to respond.</li>
        ) : (
          comments.map((c) => {
            const canDelete =
              meId && (c.userId === meId || meId === summaryOwnerId);
            return (
              <li
                key={c.id}
                className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-notionix-primary">
                  {c.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[14px] font-bold text-slate-900">{c.author.name}</span>
                    <span className="text-[12px] font-medium text-slate-400">{formatAgo(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                    {c.body}
                  </p>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="mt-2 text-[12px] font-bold text-slate-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
