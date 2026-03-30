"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { socialDeleteSave, socialPostSave } from "@/lib/social-client";

type SocialSaveButtonProps = {
  summaryId: string;
  initialSaved: boolean;
  className?: string;
  label?: boolean;
};

export function SocialSaveButton({
  summaryId,
  initialSaved,
  className = "",
  label = false,
}: SocialSaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const inFlight = useRef(false);

  useEffect(() => {
    setSaved(initialSaved);
  }, [summaryId, initialSaved]);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (inFlight.current) return;
      const next = !saved;
      setSaved(next);
      inFlight.current = true;
      try {
        if (next) {
          await socialPostSave(summaryId);
        } else {
          await socialDeleteSave(summaryId);
        }
      } catch {
        setSaved((prev) => !prev);
      } finally {
        inFlight.current = false;
      }
    },
    [summaryId, saved],
  );

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      title={saved ? "Saved" : "Save to your list"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold transition-colors ${saved ? "bg-indigo-50 text-notionix-primary" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"} ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
      {label ? <span>{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
