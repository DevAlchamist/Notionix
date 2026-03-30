"use client";

import { useCallback, useMemo, useState } from "react";
import type { SummaryListItem } from "@/lib/api";
import { InsightCard } from "@/components/InsightCard";
import { SummaryCard } from "@/components/SummaryCard";

type FilterTab = "all" | "recents" | "starred";

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  return Math.abs(h);
}

function viewsLabel(id: string): string {
  const k = 1 + (hashId(id) % 5);
  return `${k}k views`;
}

const RECENTS_MS = 7 * 24 * 60 * 60 * 1000;

function isRecent(createdAt: string): boolean {
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t <= RECENTS_MS;
}

type Props = {
  initialSummaries: SummaryListItem[];
  initialQuery?: string;
};

export function DashboardMemoriesSection({ initialSummaries, initialQuery = "" }: Props) {
  const [summaries, setSummaries] = useState<SummaryListItem[]>(initialSummaries);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [query, setQuery] = useState(initialQuery);

  const updateSummaryStar = useCallback((summaryId: string, starred: boolean) => {
    setSummaries((prev) => prev.map((s) => (s.id === summaryId ? { ...s, starred } : s)));
  }, []);

  const filtered = useMemo(() => {
    let list = summaries;
    if (filter === "starred") {
      list = list.filter((s) => s.starred === true);
    } else if (filter === "recents") {
      list = list.filter((s) => isRecent(s.createdAt));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const title = (s.title || "").toLowerCase();
        const platform = (s.platform || "").toLowerCase();
        return title.includes(q) || platform.includes(q);
      });
    }
    return list;
  }, [summaries, filter, query]);

  const tabClass = (tab: FilterTab) =>
    `rounded-[10px] px-6 py-2 text-[13px] font-bold transition-colors ${
      filter === tab
        ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
        : "text-slate-500 hover:text-slate-700"
    }`;

  if (summaries.length === 0) {
    return (
      <>
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-[32px] font-extrabold text-slate-800 tracking-tight mb-2">
              Your Knowledge Hub
            </h1>
            <p className="text-[17px] font-medium text-[#5e6b7c]">
              Access, organize, and synthesize every interaction from
              <br className="hidden sm:block" />
              your AI-driven workflow.
            </p>
          </div>
        </header>
        <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <h3 className="text-[22px] font-extrabold text-slate-800 mb-2">No summaries captured yet</h3>
          <p className="text-[#5e6b7c] text-[15px] max-w-sm mx-auto mb-8 font-medium">
            Use the Notionix Chrome extension to instantly save insights from your AI conversations.
          </p>
          <a
            href="#"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#4B5CC4] px-6 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#3f4dac]"
          >
            Get Extension
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-[32px] font-extrabold text-slate-800 tracking-tight mb-2">
            Your Knowledge Hub
          </h1>
          <p className="text-[17px] font-medium text-[#5e6b7c]">
            Access, organize, and synthesize every interaction from
            <br className="hidden sm:block" />
            your AI-driven workflow.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <form action="/dashboard" method="get" className="mb-1">
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search summaries..."
              className="h-10 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 outline-none transition focus:border-indigo-300 sm:w-[260px]"
            />
          </form>
          <div className="flex rounded-[12px] bg-slate-100 p-1.5 shadow-inner overflow-x-auto">
            <button type="button" className={tabClass("all")} onClick={() => setFilter("all")}>
              All
            </button>
            <button type="button" className={tabClass("recents")} onClick={() => setFilter("recents")}>
              Recents
            </button>
            <button type="button" className={tabClass("starred")} onClick={() => setFilter("starred")}>
              Starred
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 rounded-3xl border border-slate-100 bg-white py-20 text-center shadow-sm">
            <p className="text-[17px] font-bold text-slate-800">
              {filter === "starred"
                ? "No starred summaries yet"
                : filter === "recents"
                  ? "Nothing from the last 7 days"
                  : query.trim().length > 0
                    ? "No summaries match your search"
                    : "No summaries match this filter"}
            </p>
            <p className="mt-2 text-[15px] font-medium text-[#5e6b7c]">
              {filter === "starred"
                ? "Star a card to pin it here."
                : query.trim().length > 0
                  ? "Try a different keyword."
                  : "Try another tab or capture a new memory."}
            </p>
          </div>
        ) : (
          <>
            {filtered.map((s) => (
              <SummaryCard
                key={s.id}
                summary={s}
                viewsLabel={viewsLabel(s.id)}
                onStarredChange={(starred) => updateSummaryStar(s.id, starred)}
              />
            ))}
            {filter === "all" ? (
              <div className="md:col-span-2 order-last lg:order-0">
                <InsightCard />
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
