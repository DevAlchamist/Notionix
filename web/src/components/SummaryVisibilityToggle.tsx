"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type Props = {
  summaryId: string;
  initialVisibility: "public" | "private";
  className?: string;
};

export function SummaryVisibilityToggle({ summaryId, initialVisibility, className }: Props) {
  const router = useRouter();
  const [visibility, setVisibility] = useState<"public" | "private">(initialVisibility);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVisibility(initialVisibility);
  }, [initialVisibility]);

  const update = useCallback(
    async (next: "public" | "private") => {
      setError(null);
      setSaving(true);
      const prev = visibility;
      setVisibility(next);
      try {
        const res = await fetch(`${API_BASE_URL}/api/summaries/${encodeURIComponent(summaryId)}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility: next }),
        });
        if (!res.ok) {
          let msg = "Could not update visibility.";
          try {
            const d = await res.json();
            if (typeof d?.error === "string") msg = d.error;
          } catch {
            /* noop */
          }
          throw new Error(msg);
        }
        router.refresh();
      } catch (e) {
        setVisibility(prev);
        setError(e instanceof Error ? e.message : "Update failed.");
      } finally {
        setSaving(false);
      }
    },
    [summaryId, visibility, router],
  );

  return (
    <div className={className}>
      <div className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">
        Visibility
      </div>
      <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1">
        <button
          type="button"
          disabled={saving}
          onClick={() => void update("private")}
          className={`flex-1 rounded-lg py-2 text-[12px] font-bold transition ${
            visibility === "private"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Private
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void update("public")}
          className={`flex-1 rounded-lg py-2 text-[12px] font-bold transition ${
            visibility === "public"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Public
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Public summaries can appear on the Social feed. Link sharing uses a separate “Share” action.
      </p>
      {error ? <p className="mt-2 text-[11px] font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
