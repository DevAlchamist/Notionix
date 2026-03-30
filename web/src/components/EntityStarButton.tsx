"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { patchSummaryStarred, patchWorkspaceStarred } from "@/lib/stars-client";

type EntityKind = "summary" | "workspace";

type EntityStarButtonProps = {
  kind: EntityKind;
  id: string;
  initialStarred: boolean;
  className?: string;
  iconClassName?: string;
  label?: string;
  /** Fires immediately with optimistic value (before network completes). */
  onStarredChange?: (starred: boolean) => void;
};

export function EntityStarButton({
  kind,
  id,
  initialStarred,
  className = "",
  iconClassName = "",
  label,
  onStarredChange,
}: EntityStarButtonProps) {
  const [starred, setStarred] = useState(initialStarred);
  const inFlight = useRef(false);

  useEffect(() => {
    setStarred(initialStarred);
  }, [id, initialStarred]);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (inFlight.current) return;
      const next = !starred;
      setStarred(next);
      onStarredChange?.(next);
      inFlight.current = true;
      try {
        const patch = kind === "summary" ? patchSummaryStarred : patchWorkspaceStarred;
        const result = await patch(id, next);
        setStarred(result.starred);
        if (result.starred !== next) {
          onStarredChange?.(result.starred);
        }
      } catch {
        setStarred((prev) => !prev);
        onStarredChange?.(!next);
      } finally {
        inFlight.current = false;
      }
    },
    [kind, id, starred, onStarredChange],
  );

  return (
    <button
      type="button"
      aria-label={starred ? "Remove star" : "Star"}
      aria-pressed={starred}
      title={starred ? "Starred" : "Star"}
      onClick={toggle}
      className={`inline-flex items-center justify-center rounded-lg text-amber-400 transition-colors hover:text-amber-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B5CC4] ${className}`}
    >
      {label ? <span className="mr-1.5 text-[13px] font-semibold text-slate-600">{label}</span> : null}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={iconClassName}
        fill={starred ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}
