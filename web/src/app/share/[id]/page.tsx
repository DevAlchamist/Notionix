import Link from "next/link";
import { fetchMe, fetchSharedSummary } from "@/lib/api";
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
    .filter((l) => /^[-*•]\s/.test(l) || /^\d+\.\s/.test(l) || /^\d{2}\s/.test(l));

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

  return <p className="mt-2 text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{text}</p>;
}

export default async function SharedSummaryPage({ params }: Props) {
  const { id } = await params;
  const [summary, me] = await Promise.all([fetchSharedSummary(id), fetchMe()]);

  if (!summary) {
    return (
      <main className="min-h-screen w-full bg-[#f8f9fb]">
        <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 md:px-12 md:py-16">
          <p className="text-sm font-semibold text-slate-700">This link is not available.</p>
          <p className="mt-2 text-sm text-slate-500">
            The owner may have not shared this summary, or the link is invalid.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-semibold text-[#4B5CC4] hover:underline"
          >
            ← Go home
          </Link>
        </div>
      </main>
    );
  }

  const cleanedSummaryText = sanitizeSummaryText(summary.summaryText);
  const parsed = parseStructuredSummary(cleanedSummaryText);
  const badge = platformCategoryBadge(summary.platform);
  const captured = formatCapturedAgo(summary.createdAt);

  const preambleText = parsed.preamble.join("\n").trim();
  const introParagraph =
    preambleText || (parsed.sections.length === 0 ? cleanedSummaryText.split("\n\n")[0]?.trim() : "");
  const canSeeSource = Boolean(me?.id && summary.ownerId && me.id === summary.ownerId);

  return (
    <main className="min-h-screen w-full bg-[#f8f9fb]">
      <div className="mx-auto max-w-[980px] px-4 py-8 pb-24 sm:px-6 md:px-12 md:py-10">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-indigo-800">
            {badge}
          </span>
          <span className="text-sm font-medium text-slate-500">{captured}</span>
          <span className="ml-auto text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
            Shared summary
          </span>
        </div>

        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-tight text-slate-900 leading-tight">
          {summary.title}
        </h1>

        <article className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
          {introParagraph ? (
            <p className="text-[15px] leading-relaxed text-slate-700 mb-6">
              {introParagraph.split(/\n\n/)[0]}
            </p>
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

        {canSeeSource ? (
          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-3">
              Source
            </div>
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
        ) : null}
      </div>
    </main>
  );
}

