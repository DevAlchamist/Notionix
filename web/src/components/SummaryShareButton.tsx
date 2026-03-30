"use client";

import { useCallback, useState } from "react";
import type { SummaryDetail } from "@/lib/api";
import { ShareSummaryModal } from "@/components/ShareSummaryModal";

type Props = {
  summary: Pick<SummaryDetail, "id" | "title" | "summaryText" | "url" | "platform" | "createdAt">;
  className?: string;
};

export function SummaryShareButton({ summary, className }: Props) {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        className={
          className ??
          "rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        }
        onClick={openModal}
      >
        Share
      </button>
      <ShareSummaryModal open={open} onClose={closeModal} summary={summary} />
    </>
  );
}

