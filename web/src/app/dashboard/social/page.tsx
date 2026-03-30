import Link from "next/link";
import { fetchSocialFeed } from "@/lib/api";
import { SocialFeedCard } from "@/components/SocialFeedCard";

export default async function SocialFeedPage() {
  const { items: feed, hasMore } = await fetchSocialFeed({ limit: 40 });
  const displayCount = feed.length;

  const contributorMap = new Map<string, { name: string; count: number }>();
  for (const item of feed) {
    const a = item.author;
    if (!a.id) continue;
    const cur = contributorMap.get(a.id) ?? { name: a.name, count: 0 };
    cur.count += 1;
    contributorMap.set(a.id, cur);
  }
  const topContributors = [...contributorMap.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((x, y) => y.count - x.count)
    .slice(0, 5);

  return (
    <main className="min-h-0 w-full flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1280px] px-6 py-10 pb-24 md:px-10 lg:px-12">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900">Social Feed</h1>
            <p className="mt-2 max-w-xl text-[16px] font-medium text-[#5e6b7c]">
              Public summaries from everyone on Notionix—like, comment, and save what resonates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/social/saved"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
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
                aria-hidden
              >
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              Saved
            </Link>
          </div>
        </header>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1 space-y-6">
            {feed.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
                <p className="text-[17px] font-bold text-slate-800">No public summaries yet</p>
                <p className="mt-2 text-[15px] text-[#5e6b7c]">
                  When anyone sets a memory to public, it will show up in this feed.
                </p>
              </div>
            ) : (
              feed.map((item, i) => <SocialFeedCard key={item.id} summary={item} index={i} />)
            )}
          </div>

          <aside className="w-full shrink-0 space-y-6 lg:w-[320px]">
            <div className="relative overflow-hidden rounded-xl bg-[#1a237e] px-6 py-7 text-white shadow-md">
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute bottom-0 left-1/4 h-24 w-24 rounded-full bg-indigo-400/20"
                aria-hidden
              />
              <p className="relative text-4xl font-extrabold tracking-tight">{displayCount}</p>
              <p className="relative mt-1 text-[13px] font-semibold text-indigo-100">
                Public summaries in this batch{hasMore ? " (scroll or paginate later)" : ""}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-6 shadow-sm">
              <h3 className="mb-5 text-[13px] font-extrabold uppercase tracking-wider text-slate-500">
                How it works
              </h3>
              <ul className="space-y-4 text-[14px] leading-relaxed text-slate-600">
                <li>
                  <span className="font-bold text-slate-800">Public</span> — Summaries marked public appear
                  for signed-in users here.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Share link</span> — A separate setting on each
                  memory controls the /share/… page.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Save</span> — Bookmarks are listed under Saved;
                  if a memory is made private again, it leaves Saved.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-[13px] font-extrabold uppercase tracking-wider text-slate-500">
                Top contributors
              </h3>
              <ul className="space-y-4">
                {topContributors.length === 0 ? (
                  <li className="text-[13px] font-medium text-slate-500">No contributors yet.</li>
                ) : (
                  topContributors.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {c.name
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-slate-900">{c.name}</p>
                          <p className="truncate text-[11px] font-semibold text-slate-400">
                            {c.count} public {c.count === 1 ? "memory" : "summaries"}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
