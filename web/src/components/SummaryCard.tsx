"use client";

import Link from "next/link";
import { EntityStarButton } from "@/components/EntityStarButton";

interface SummaryCardProps {
  summary: {
    id: string;
    title: string;
    platform: string;
    createdAt: string;
    preview?: string;
    tags?: Array<{ _id?: string; name?: string; color?: string }>;
    starred?: boolean;
  };
  viewsLabel: string;
  onStarredChange?: (starred: boolean) => void;
}

export function SummaryCard({ summary, viewsLabel, onStarredChange }: SummaryCardProps) {
  const isChatGPT = summary.platform?.toLowerCase().includes("chatgpt");
  const isClaude = summary.platform?.toLowerCase().includes("claude");
  const isPerplexity = summary.platform?.toLowerCase().includes("perplexity");

  let badgeBg = "bg-[#EEF2F6] text-[#5e6b7c]";
  if (isChatGPT) badgeBg = "bg-[#E3F2FD] text-[#0277bd]";
  else if (isClaude) badgeBg = "bg-[#F3E5F5] text-[#8e24aa]";
  else if (isPerplexity) badgeBg = "bg-[#E0F7FA] text-[#00838f]";

  const description = summary.preview?.trim() || "No summary preview available.";
  const tags = (summary.tags ?? [])
    .map((tag) => String(tag?.name ?? "").trim())
    .filter((name) => name.length > 0)
    .slice(0, 3);

  return (
    <div className="relative h-full">
      <Link
        href={`/dashboard/summaries/${summary.id}`}
        className="block h-full cursor-pointer hover:-translate-y-1 transition-transform duration-300"
      >
        <div className="flex h-[260px] flex-col rounded-[20px] bg-white p-6 pr-12 shadow-sm border border-slate-100/80 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between mb-5">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}
            >
              {summary.platform}
            </span>
          </div>

          <h2 className="text-[17px] font-bold text-slate-900 leading-snug mb-3 line-clamp-2">
            {summary.title}
          </h2>

          <p className="text-[13px] text-[#5e6b7c] leading-relaxed line-clamp-3 mb-5 flex-1">
            {description}
          </p>

          {tags.length > 0 ? (
            <div className="flex gap-2 mb-4">
              {tags.map((tag, idx) => (
                <span
                  key={`${summary.id}-${idx}-${tag}`}
                  className="rounded-md bg-indigo-50/50 px-2 py-1 text-[11px] font-semibold text-notionix-primary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <time>
                {new Date(summary.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              {viewsLabel}
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute right-4 top-4 z-10">
        <EntityStarButton
          kind="summary"
          id={summary.id}
          initialStarred={summary.starred === true}
          iconClassName="h-4 w-4"
          onStarredChange={onStarredChange}
        />
      </div>
    </div>
  );
}
