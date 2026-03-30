import Link from "next/link";
import type { SocialFeedItem } from "@/lib/api";
import { SocialLikeButton } from "@/components/SocialLikeButton";
import { SocialSaveButton } from "@/components/SocialSaveButton";

function modelLabel(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("chatgpt") || p.includes("openai")) return "GPT / OpenAI";
  if (p.includes("claude")) return "Claude";
  if (p.includes("gemini")) return "Gemini";
  if (p.includes("perplexity")) return "Perplexity";
  return platform || "AI Assistant";
}

interface SocialFeedCardProps {
  summary: SocialFeedItem;
  index: number;
}

export function SocialFeedCard({ summary, index }: SocialFeedCardProps) {
  const accentClass = index % 2 === 0 ? "bg-[#3d5afe]" : "bg-slate-300";
  const isChatGPT = summary.platform?.toLowerCase().includes("chatgpt");
  const isClaude = summary.platform?.toLowerCase().includes("claude");
  const initials = summary.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="relative flex overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className={`w-1 shrink-0 ${accentClass}`} aria-hidden />
      <div className="min-w-0 flex-1 p-6 md:p-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-100 to-slate-200 text-sm font-bold text-notionix-primary"
              aria-hidden
            >
              {initials || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-slate-900">{summary.author.name}</p>
              <p className="text-[11px] font-semibold tracking-wide text-slate-400">Shared publicly</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-[12px] font-semibold text-violet-700">
            {summary.commentCount} {summary.commentCount === 1 ? "comment" : "comments"}
          </span>
        </div>

        <h2 className="mb-3 text-xl font-extrabold leading-snug tracking-tight text-slate-900 md:text-[22px]">
          {summary.title}
        </h2>
        <p className="mb-5 text-[15px] leading-relaxed text-[#5e6b7c]">{summary.preview}</p>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
            {isChatGPT && (
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-[10px] font-bold text-sky-700">
                AI
              </span>
            )}
            {isClaude && (
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-700">
                C
              </span>
            )}
            {!isChatGPT && !isClaude && (
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                ·
              </span>
            )}
            <span>{modelLabel(summary.platform)}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={`/dashboard/social/${summary.id}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#283593] px-6 text-[14px] font-bold text-white shadow-sm transition hover:bg-[#1e2766]"
            >
              Open discussion
            </Link>
            <div className="flex flex-wrap items-center gap-1">
              <SocialLikeButton
                summaryId={summary.id}
                initialLiked={summary.likedByMe}
                initialCount={summary.likeCount}
              />
              <SocialSaveButton summaryId={summary.id} initialSaved={summary.savedByMe} label />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
