"use client";

import Link from "next/link";
import type { NotificationsListResponse } from "@/lib/notifications-client";

function actionLabel(t: "like" | "comment" | "save"): string {
  if (t === "like") return "liked";
  if (t === "save") return "saved";
  return "commented on";
}

function groupedLabel(t: "like" | "comment" | "save", count: number): string {
  const base = t === "like" ? "Liked" : t === "save" ? "Saved" : "Commented";
  return `${base} by ${count} user${count === 1 ? "" : "s"}`;
}

export function NotificationsDropdown({
  data,
  onClose,
}: {
  data: NotificationsListResponse;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-12 z-50 w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-[13px] font-extrabold tracking-tight text-slate-900">Notifications</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2 py-1 text-[12px] font-bold text-slate-500 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">New</p>
        </div>

        {data.newEvents.length === 0 ? (
          <div className="px-4 pb-4 text-[13px] font-medium text-slate-500">No new activity yet.</div>
        ) : (
          <ul className="px-2 pb-2">
            {data.newEvents.map((n) => {
              const href = n.summary?.id ? `/dashboard/social/${n.summary.id}` : "/dashboard/social";
              const actorName = n.actor?.name ?? "Someone";
              return (
                <li key={n.id}>
                  <Link
                    href={href}
                    onClick={onClose as any}
                    className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                      {n.actor?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.actor.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        actorName.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-slate-800">
                        <span className="font-extrabold">{actorName}</span>{" "}
                        <span className="font-medium">{actionLabel(n.eventType)} your memory</span>
                      </p>
                      <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500">
                        {n.summary?.title ?? "Memory"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="px-4 pt-3 pb-2 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Older</p>
        </div>

        {data.olderGroups.length === 0 ? (
          <div className="px-4 pb-4 text-[13px] font-medium text-slate-500">No older notifications.</div>
        ) : (
          <ul className="px-2 pb-3">
            {data.olderGroups.map((g) => {
              const href = g.summary?.id ? `/dashboard/social/${g.summary.id}` : "/dashboard/social";
              const actors = g.actors.slice(0, 3);
              return (
                <li key={g.id}>
                  <Link
                    href={href}
                    onClick={onClose as any}
                    className="flex gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50"
                  >
                    <div className="relative flex h-9 w-12 shrink-0 items-center">
                      {actors.map((a, idx) => {
                        const left = idx * 12;
                        const name = a.name ?? "U";
                        return (
                          <div
                            key={a.id || `${g.id}-${idx}`}
                            className="absolute h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600"
                            style={{ left }}
                          >
                            {a.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={a.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                {name.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-slate-800">
                        <span className="font-extrabold">{groupedLabel(g.eventType, g.count)}</span>{" "}
                        <span className="font-medium">your memory</span>
                      </p>
                      <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500">
                        {g.summary?.title ?? "Memory"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

