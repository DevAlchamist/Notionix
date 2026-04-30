import Link from "next/link";
import { fetchSummary } from "@/lib/api";
import { EntityStarButton } from "@/components/EntityStarButton";
import { SummaryShareButton } from "@/components/SummaryShareButton";
import { SummaryVisibilityToggle } from "@/components/SummaryVisibilityToggle";
import { DeleteSummaryButton } from "@/components/DeleteSummaryButton";
import { ContinueInAiActions } from "@/components/ContinueInAiActions";
import { buildContinueAgentLinks, buildContinuationPrompt } from "@/lib/agentRedirect";
import {
  formatCapturedAgo,
  parseStructuredSummary,
  sanitizeSummaryText,
  platformCategoryBadge,
  truncateUrl,
} from "@/lib/parseSummary";

type Props = {
  params: Promise<{ id: string }>;
};

function SectionBody({ lines }: { lines: string[] }) {
  const text = lines.join("\n").trim();
  if (!text) return null;

  const bulletLines = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        /^[-*•]\s/.test(l) ||
        /^\d+\.\s/.test(l) ||
        /^\d{2}\s/.test(l),
    );

  if (bulletLines.length >= 2) {
    return (
      <ol className="mt-3 space-y-3 list-none">
        {bulletLines.map((line, i) => {
          const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").replace(/^\d{2}\s+/, "");
          const num = String(i + 1).padStart(2, "0");
          return (
            <li key={i} className="flex gap-4 text-[15px] leading-relaxed text-slate-700">
              <span className="shrink-0 font-mono text-[11px] font-bold text-indigo-400 pt-0.5">
                {num}
              </span>
              <span>{cleaned}</span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <p className="mt-2 text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">
      {text}
    </p>
  );
}

export default async function MemoryDetailPage({ params }: Props) {
  const { id } = await params;
  const summary = await fetchSummary(id);

  if (!summary) {
    return (
      <main className="min-h-0 flex-1 overflow-y-auto w-full">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 md:px-12 md:py-16">
          <p className="text-sm text-slate-600">Memory not found.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex text-sm font-semibold text-[#4B5CC4] hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const cleanedSummaryText = sanitizeSummaryText(summary.summaryText);
  const parsed = parseStructuredSummary(cleanedSummaryText);
  const badge = platformCategoryBadge(summary.platform);
  const captured = formatCapturedAgo(summary.createdAt);
  const tags = (summary.tags ?? [])
    .map((tag) => String(tag?.name ?? "").trim())
    .filter((name) => name.length > 0)
    .slice(0, 8);

  const preambleText = parsed.preamble.join("\n").trim();
  const mainTopicText =
    parsed.sections.find((s) => s.key === "main topic")?.lines.join("\n").trim() ||
    "";
  const insightsFirstLine = parsed.sections
    .find((s) => s.key === "important insights")
    ?.lines.map((l) => l.trim())
    .find((l) => l.length > 0);

  const introParagraph =
    preambleText ||
    (parsed.sections.length === 0 ? cleanedSummaryText.split("\n\n")[0]?.trim() : "");

  const pullQuote =
    insightsFirstLine ||
    (mainTopicText && mainTopicText !== introParagraph
      ? mainTopicText.split("\n")[0]?.slice(0, 220)
      : null);

  const continuationPrompt = buildContinuationPrompt(summary.title, cleanedSummaryText);
  const continueAgents = buildContinueAgentLinks(continuationPrompt);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto w-full bg-[#f8f9fb]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 pb-24 sm:px-6 md:px-12 md:py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-slate-500 hover:text-slate-800 mb-8"
        >
          <span aria-hidden>←</span> BACK TO DASHBOARD
        </Link>

        <div className="flex flex-col xl:flex-row gap-10 xl:gap-14">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-indigo-800">
                {badge}
              </span>
              <span className="text-sm font-medium text-slate-500">{captured}</span>
              <EntityStarButton
                kind="summary"
                id={summary.id}
                initialStarred={summary.starred === true}
                className="ml-auto sm:ml-0 h-9 w-9 rounded-xl border border-slate-200/80 bg-white shadow-sm"
                iconClassName="h-[18px] w-[18px]"
              />
            </div>

            <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-tight text-slate-900 leading-tight">
              {summary.title}
            </h1>

            <article className="rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 text-white text-lg leading-none">
                  ✦
                </span>
                <span className="tracking-wide">AI SUMMARY</span>
              </div>

              {parsed.sections.length > 0 && introParagraph ? (
                <p className="text-[15px] leading-relaxed text-slate-700 mb-6">
                  {introParagraph.split(/\n\n/)[0]}
                </p>
              ) : null}

              {pullQuote && pullQuote.length > 12 ? (
                <blockquote className="my-6 border-l-4 border-indigo-200 pl-5 py-1 text-[15px] italic text-slate-600 leading-relaxed">
                  &ldquo;{pullQuote.length > 200 ? pullQuote.slice(0, 197) + "…" : pullQuote}&rdquo;
                </blockquote>
              ) : null}

              <div className="space-y-8">
                {parsed.sections.map((sec) => {
                  if (sec.key === "title") return null;
                  return (
                  <section key={sec.key}>
                    <h2 className="text-xs font-bold tracking-[0.14em] text-slate-400 uppercase">
                      {sec.label}
                    </h2>
                    <SectionBody lines={sec.lines} />
                  </section>
                  );
                })}

                {parsed.sections.length === 0 && (
                  <div className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {cleanedSummaryText}
                  </div>
                )}
              </div>
            </article>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/dashboard/capture?edit=${encodeURIComponent(summary.id)}`}
                className="rounded-xl bg-[#4B5CC4] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
              >
                Edit Memory
              </Link>
              <SummaryShareButton summary={summary} />
              <DeleteSummaryButton summaryId={summary.id} />
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="w-full shrink-0 space-y-5 xl:w-[300px]">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">
                Context
              </h3>
              <p className="text-sm font-semibold text-slate-800">
                {summary.platform} capture
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Saved from your AI workflow via the browser extension.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <SummaryVisibilityToggle
                summaryId={summary.id}
                initialVisibility={summary.visibility === "public" ? "public" : "private"}
              />
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-3">
                Source
              </h3>
              <a
                href={summary.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-[#4B5CC4] font-medium hover:bg-slate-100"
              >
                <span className="truncate">{truncateUrl(summary.url)}</span>
                <span className="shrink-0" aria-hidden>
                  ↗
                </span>
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-3">
                Tags
              </h3>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t, idx) => (
                    <span
                      key={`${summary.id}-${idx}-${t}`}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No tags attached.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-3">
                Continue in AI
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Open a new chat with this memory summary as the starting context.
              </p>
              <ContinueInAiActions prompt={continuationPrompt} links={continueAgents} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
