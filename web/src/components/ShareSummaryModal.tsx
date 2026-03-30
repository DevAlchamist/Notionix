"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { enableSummaryShare, type SummaryDetail } from "@/lib/api";
import { sanitizeSummaryText } from "@/lib/parseSummary";

type Props = {
  open: boolean;
  onClose: () => void;
  summary: Pick<SummaryDetail, "id" | "title" | "summaryText" | "url" | "platform" | "createdAt">;
};

function buildShareText(summary: Props["summary"]) {
  const cleaned = sanitizeSummaryText(summary.summaryText ?? "");
  const parts = [
    summary.title?.trim() ? summary.title.trim() : "(Untitled)",
    "",
    cleaned.trim() ? cleaned.trim() : "",
    "",
    summary.url ? `Source: ${summary.url}` : "",
    summary.platform ? `Platform: ${summary.platform}` : "",
    summary.createdAt ? `Captured: ${new Date(summary.createdAt).toLocaleString()}` : "",
  ].filter((p) => String(p).trim().length > 0);
  return parts.join("\n");
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function ShareSummaryModal({ open, onClose, summary }: Props) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const shareText = useMemo(() => buildShareText(summary), [summary]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/share/${encodeURIComponent(summary.id)}`;
  }, [summary.id]);

  const handleCopyText = useCallback(async () => {
    setBusy(true);
    const ok = await copyToClipboard(shareText);
    setBusy(false);
    setToast(ok ? "Copied text." : "Could not copy.");
  }, [shareText]);

  const handleCopyLink = useCallback(async () => {
    setBusy(true);
    const enabled = await enableSummaryShare(summary.id);
    if (!enabled) {
      setBusy(false);
      setToast("Could not enable sharing.");
      return;
    }
    const ok = await copyToClipboard(shareUrl);
    setBusy(false);
    setToast(ok ? "Copied link." : "Could not copy.");
  }, [shareUrl, summary.id]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Share summary"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-[520px] rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_70px_rgba(2,6,23,0.18)]">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
              Share
            </div>
            <div className="mt-1 text-[16px] font-extrabold text-slate-900 truncate">
              {summary.title || "(Untitled)"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Copy the text or create a link to view this summary.
            </div>
          </div>

          <button
            type="button"
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-3">
          <button
            type="button"
            onClick={handleCopyText}
            disabled={busy}
            className="w-full rounded-xl bg-[#4B5CC4] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            Copy text
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={busy}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Copy link
          </button>

          <div className="pt-2">
            <div className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase mb-2">
              Link preview
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 break-all">
              {shareUrl}
            </div>
          </div>

          {toast ? (
            <div className="pt-2 text-xs font-semibold text-slate-600">{toast}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

