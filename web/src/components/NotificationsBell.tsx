"use client";

import { useEffect, useRef, useState } from "react";
import {
  getList,
  getUnreadCount,
  markSeen,
  subscribeToNotificationsStream,
  type NotificationsListResponse,
} from "@/lib/notifications-client";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

export function NotificationsBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsListResponse>({ newEvents: [], olderGroups: [] });
  const [loading, setLoading] = useState(false);
  const markingSeenRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getUnreadCount();
      if (!cancelled) setUnread(u);
    })();
    const sub = subscribeToNotificationsStream({
      onUnread: (u) => setUnread(u),
      onRefresh: async () => {
        if (!open) return;
        try {
          const d = await getList({ limit: 20, groupLimit: 20 });
          setData(d);
        } catch {
          // ignore
        }
      },
      onError: () => {
        // ignore
      },
    });
    return () => {
      cancelled = true;
      sub.close();
    };
  }, [open]);

  async function markAllSeenIfNeeded() {
    if (markingSeenRef.current || unread <= 0) return;
    markingSeenRef.current = true;
    try {
      const nextUnread = await markSeen();
      setUnread(nextUnread);
    } finally {
      markingSeenRef.current = false;
    }
  }

  function closeDropdown() {
    setOpen(false);
    void markAllSeenIfNeeded();
  }

  async function toggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen) {
      void markAllSeenIfNeeded();
      return;
    }

    setLoading(true);
    try {
      const d = await getList({ limit: 20, groupLimit: 20 });
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-label="Notifications"
      >
        <svg fill="currentColor" viewBox="0 0 24 24" className="h-[22px] w-[22px]">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        loading ? (
          <div className="absolute right-0 top-12 z-50 w-[380px] rounded-2xl border border-slate-200 bg-white p-4 text-[13px] font-medium text-slate-500 shadow-xl">
            Loading…
          </div>
        ) : (
          <NotificationsDropdown data={data} onClose={closeDropdown} />
        )
      ) : null}
    </div>
  );
}

