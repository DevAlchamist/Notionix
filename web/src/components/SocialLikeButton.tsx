"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { socialDeleteLike, socialPostLike } from "@/lib/social-client";

type SocialLikeButtonProps = {
  summaryId: string;
  initialLiked: boolean;
  initialCount: number;
  className?: string;
};

export function SocialLikeButton({
  summaryId,
  initialLiked,
  initialCount,
  className = "",
}: SocialLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const inFlight = useRef(false);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [summaryId, initialLiked, initialCount]);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (inFlight.current) return;
      const nextLiked = !liked;
      const nextCount = Math.max(0, count + (nextLiked ? 1 : -1));
      setLiked(nextLiked);
      setCount(nextCount);
      inFlight.current = true;
      try {
        const res = nextLiked ? await socialPostLike(summaryId) : await socialDeleteLike(summaryId);
        setLiked(res.liked);
        setCount(res.likeCount);
      } catch {
        setLiked((prev) => !prev);
        setCount((c) => c + (nextLiked ? -1 : 1));
      } finally {
        inFlight.current = false;
      }
    },
    [summaryId, liked, count],
  );

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      title={liked ? "Unlike" : "Like"}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors ${liked ? "bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"} ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}
