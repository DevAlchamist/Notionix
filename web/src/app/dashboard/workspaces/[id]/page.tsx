import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchWorkspaceDetail, type WorkspaceSummaryListItem } from "@/lib/api";
import { EntityStarButton } from "@/components/EntityStarButton";
import { platformCategoryBadge, suggestTags } from "@/lib/parseSummary";

type Props = {
  params: Promise<{ id: string }>;
};

function formatMemoryTimestamp(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

function platformAccent(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes("chatgpt") || p.includes("openai")) {
    return { chip: "bg-sky-50 text-sky-800" };
  }
  if (p.includes("claude")) {
    return { chip: "bg-violet-50 text-violet-800" };
  }
  if (p.includes("gemini")) {
    return { chip: "bg-blue-50 text-blue-800" };
  }
  return { chip: "bg-slate-100 text-slate-700" };
}

function FeaturedMemoryCard({ summary }: { summary: WorkspaceSummaryListItem }) {
  const accent = platformAccent(summary.platform);
  const tags = suggestTags(summary.platform, summary.title).slice(0, 2);
  const preview =
    summary.preview?.trim() ||
    "Open this memory to read the full summary captured from your AI conversation.";

  return (
    <div className="relative lg:col-span-2">
    <Link
      href={`/dashboard/summaries/${summary.id}`}
      className="group flex flex-col rounded-[20px] border border-slate-100 bg-white p-7 pr-12 shadow-[0_2px_12px_rgb(0,0,0,0.02)] transition-all hover:border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              <path d="M5 3v4" />
              <path d="M19 17v4" />
              <path d="M3 5h4" />
              <path d="M17 19h4" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 line-clamp-2">
              {summary.title || "Untitled memory"}
            </h2>
            <p className="mt-1 text-[12px] font-medium text-slate-500">
              {formatMemoryTimestamp(summary.createdAt)}
            </p>
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500"
          aria-hidden
        >
          ···
        </span>
      </div>

      <p className="mb-6 text-[14px] leading-relaxed text-slate-600 line-clamp-4">{preview}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600"
            >
              {t}
            </span>
          ))}
          <span
            className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${accent.chip}`}
          >
            {platformCategoryBadge(summary.platform)}
          </span>
        </div>
        <span className="text-[13px] font-bold text-[#4B5CC4] group-hover:underline">
          Open Details →
        </span>
      </div>
    </Link>
    <div className="absolute right-5 top-5 z-10">
      <EntityStarButton
        kind="summary"
        id={summary.id}
        initialStarred={summary.starred === true}
        iconClassName="h-5 w-5"
      />
    </div>
    </div>
  );
}

function StandardMemoryCard({
  summary,
  variant = "default",
}: {
  summary: WorkspaceSummaryListItem;
  variant?: "default" | "quote";
}) {
  const accent = platformAccent(summary.platform);
  const tags = suggestTags(summary.platform, summary.title).slice(0, 2);
  const preview =
    summary.preview?.trim() ||
    "Captured summary from your AI session. Open to read the full content.";

  return (
    <div className="relative h-full">
    <Link
      href={`/dashboard/summaries/${summary.id}`}
      className="group flex h-full flex-col rounded-[20px] border border-slate-100 bg-white p-6 pr-11 shadow-[0_2px_12px_rgb(0,0,0,0.02)] transition-all hover:border-slate-200 hover:shadow-[0_8px_26px_rgb(0,0,0,0.05)]"
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span className="text-[10px] font-extrabold tracking-widest text-slate-400">
          {formatShortDate(summary.createdAt)}
        </span>
      </div>

      <h3 className="mb-3 text-[16px] font-bold leading-snug text-slate-900 line-clamp-2">
        {summary.title || "Untitled memory"}
      </h3>

      {variant === "quote" ? (
        <blockquote className="mb-4 border-l-2 border-slate-200 pl-3 text-[13px] italic leading-relaxed text-slate-600 line-clamp-3">
          {preview}
        </blockquote>
      ) : (
        <p className="mb-4 flex-1 text-[13px] leading-relaxed text-slate-600 line-clamp-3">{preview}</p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${accent.chip}`}
          >
            {t}
          </span>
        ))}
      </div>

      <span className="mt-auto block w-full rounded-xl bg-slate-50 py-2.5 text-center text-[13px] font-bold text-slate-800 transition-colors group-hover:bg-slate-100/90">
        View
      </span>
    </Link>
    <div className="absolute right-3 top-3 z-10">
      <EntityStarButton
        kind="summary"
        id={summary.id}
        initialStarred={summary.starred === true}
        iconClassName="h-4 w-4"
      />
    </div>
    </div>
  );
}

export default async function WorkspaceProjectPage({ params }: Props) {
  const { id } = await params;

  let workspace: Awaited<ReturnType<typeof fetchWorkspaceDetail>>;
  try {
    workspace = await fetchWorkspaceDetail(id);
  } catch {
    return (
      <main className="min-h-0 flex-1 overflow-y-auto w-full">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 md:px-12 md:py-16">
          <p className="text-sm font-medium text-red-700">Could not load this workspace. Try again later.</p>
          <Link
            href="/dashboard/workspaces"
            className="mt-4 inline-flex text-sm font-semibold text-[#4B5CC4] hover:underline"
          >
            ← Back to workspaces
          </Link>
        </div>
      </main>
    );
  }

  if (!workspace) {
    notFound();
  }

  const summaries = workspace.summaries ?? [];
  const [featured, second, ...rest] = summaries;
  const workspaceTags = workspace.tags ?? [];

  return (
    <main className="min-h-0 flex-1 overflow-y-auto w-full">
      <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6 md:px-12 md:pb-28 md:pt-10">
        <nav className="mb-6 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          <Link href="/dashboard/workspaces" className="transition-colors hover:text-[#4B5CC4]">
            Spaces
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-600">Project: {workspace.name}</span>
        </nav>

        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-start gap-3">
            <h1 className="min-w-0 flex-1 text-[24px] font-extrabold tracking-tight text-slate-900 sm:text-[28px] md:text-[32px]">
              Space: {workspace.name}
            </h1>
            <EntityStarButton
              kind="workspace"
              id={workspace.id}
              initialStarred={workspace.starred === true}
              className="h-10 w-10 shrink-0 rounded-xl border border-slate-200/80 bg-white shadow-sm"
              iconClassName="h-[18px] w-[18px]"
            />
            </div>
            <p className="mt-3 text-[16px] font-medium leading-relaxed text-[#5e6b7c]">
              {workspace.description?.trim() ||
                "Collective knowledge for this workspace. Summaries are captured from your AI conversations."}
            </p>

            {workspaceTags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {workspaceTags.map((tag) => (
                  <span
                    key={String(tag._id ?? tag.id ?? tag.name)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600"
                  >
                    # {(tag.name || "tag").trim()}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                title="Coming soon"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filter
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#4B5CC4] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#3f4dac]"
                title="Coming soon"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Collaborate
              </button>
            </div>
            <p className="text-left text-[13px] font-semibold text-slate-500 sm:text-right">
              Displaying <span className="text-slate-800">{summaries.length}</span>{" "}
              {summaries.length === 1 ? "Summary" : "Summaries"}
            </p>
          </div>
        </header>

        {summaries.length === 0 ? (
          <div className="mb-16 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center">
            <p className="text-[16px] font-bold text-slate-800">No summaries in this workspace yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Save a summary from the browser extension and choose this project, or assign existing summaries from the
              dashboard.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-[10px] bg-[#4B5CC4] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3f4dac]"
            >
              Go to all summaries
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {featured ? <FeaturedMemoryCard summary={featured} /> : null}
              {second ? <StandardMemoryCard summary={second} variant="quote" /> : null}
            </div>

            {rest.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {rest.map((s, i) => (
                  <StandardMemoryCard key={s.id} summary={s} variant={i % 2 === 1 ? "quote" : "default"} />
                ))}
              </div>
            ) : null}
          </>
        )}

        <section className="mt-16 rounded-[24px] border border-slate-100 bg-[#eef1f4] px-5 py-10 text-center sm:px-8 sm:py-12">
          <div className="mx-auto flex max-w-lg flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Build more summaries</h2>
            <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#5e6b7c]">
              Continue your exploration. Capture conversations with ChatGPT, Claude, or Gemini using the Notionix
              extension—they sync into your workspaces automatically.
            </p>
            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex rounded-[12px] bg-[#4B5CC4] px-8 py-3.5 text-[15px] font-bold text-white shadow-md transition hover:bg-[#3f4dac]"
            >
              Start AI conversation
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
