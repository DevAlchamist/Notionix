import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMe, fetchSocialSummary } from "@/lib/api";
import {
  formatCapturedAgo,
  parseStructuredSummary,
  sanitizeSummaryText,
  platformCategoryBadge,
  truncateUrl,
} from "@/lib/parseSummary";
import { SocialDiscussion } from "@/components/SocialDiscussion";
import { SocialDetailActions } from "@/components/SocialDetailActions";

type Props = { params: Promise<{ id: string }> };

function SectionBody({ lines }: { lines: string[] }) {
  const text = lines.join("\n").trim();
  if (!text) return null;

  const bulletLines = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => /^[-*•]\s/.test(l) || /^\d+\.\s/.test(l) || /^\d{2}\s/.test(l));

  if (bulletLines.length >= 2) {
    return (
      <ol className="mt-3 list-none space-y-3">
        {bulletLines.map((line, i) => {
          const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").replace(/^\d{2}\s+/, "");
          const num = String(i + 1).padStart(2, "0");
          return (
            <li key={i} className="flex gap-4 text-[15px] leading-relaxed text-slate-700">
              <span className="shrink-0 pt-0.5 font-mono text-[11px] font-bold text-indigo-400">
                {num}
              </span>
              <span>{cleaned}</span>
            </li>
          );
        })}
      </ol>
    );
  }

  return <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap text-slate-700">{text}</p>;
}

export default async function SocialSummaryDetailPage({ params }: Props) {
  const { id } = await params;
  const [summary, me] = await Promise.all([fetchSocialSummary(id), fetchMe()]);
  if (!summary) notFound();
  const canSeeSource = Boolean(me?.id && summary.ownerId && me.id === summary.ownerId);

  const cleanedSummaryText = sanitizeSummaryText(summary.summaryText);
  const parsed = parseStructuredSummary(cleanedSummaryText);
  const badge = platformCategoryBadge(summary.platform);
  const captured = formatCapturedAgo(summary.createdAt);

  const preambleText = parsed.preamble.join("\n").trim();
  const introParagraph =
    preambleText ||
    (parsed.sections.length === 0 ? cleanedSummaryText.split("\n\n")[0]?.trim() : "");

  return (
    <main className="min-h-0 w-full flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[980px] px-6 py-10 pb-24 md:px-10 lg:px-12">
        <Link
          href="/dashboard/social"
          className="mb-6 inline-flex text-[13px] font-bold text-[#4B5CC4] hover:underline"
        >
          ← Social feed
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-indigo-800">
              {badge}
            </span>
            <span className="text-sm font-medium text-slate-500">{captured}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Public memory
            </span>
          </div>
          <SocialDetailActions
            summaryId={summary.id}
            initialLiked={summary.likedByMe}
            likeCount={summary.likeCount}
            initialSaved={summary.savedByMe}
          />
        </div>

        <p className="mb-2 text-[13px] font-semibold text-slate-500">
          {summary.author.name}
        </p>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-tight tracking-tight text-slate-900">
          {summary.title}
        </h1>

        <article className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
          {introParagraph ? (
            <p className="mb-6 text-[15px] leading-relaxed text-slate-700">
              {introParagraph.split(/\n\n/)[0]}
            </p>
          ) : null}

          <div className="space-y-8">
            {parsed.sections.map((sec) => {
              if (sec.key === "title") return null;
              return (
                <section key={sec.key}>
                  <h2 className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">{sec.label}</h2>
                  <SectionBody lines={sec.lines} />
                </section>
              );
            })}

            {parsed.sections.length === 0 && (
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-slate-700">
                {cleanedSummaryText}
              </div>
            )}
          </div>
        </article>

        <SocialDiscussion summaryId={summary.id} summaryOwnerId={summary.ownerId ?? ""} />
      </div>
    </main>
  );
}
