"use client";

import { NotificationsBell } from "@/components/NotificationsBell";
import { clientApiUrl } from "@/lib/apiBase";
import { useEffect, useRef, useState } from "react";

interface TopBarProps {
  user: any;
}

export function TopBar({ user }: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  async function logout() {
    try {
      await fetch(clientApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between gap-3 border-b border-slate-100 bg-[#FCFCFD]/80 px-3 backdrop-blur-md sm:px-5 md:px-8">
      <form
        action="/dashboard"
        method="get"
        className="hidden w-full max-w-2xl items-center rounded-2xl bg-[#f1f3f7] px-4 py-2.5 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:shadow-sm sm:flex"
      >
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="mr-3 h-[18px] w-[18px] text-slate-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />
        </svg>
        <input
          type="text"
          name="q"
          placeholder="Search across your summaries..."
          className="w-full bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-medium"
        />
      </form>
      <div className="flex items-center gap-2 sm:gap-4 md:gap-5">
        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 sm:gap-3">
          <NotificationsBell />
          <button className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:flex">
            <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="h-5 w-5">
               <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          </button>
        </div>

        {user ? (
          <div className="flex items-center gap-2 pl-1 sm:gap-3 sm:pl-2" ref={profileRef}>
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-[13px] font-bold text-slate-900">{user.name || "User"}</p>
              <p className="text-[11px] font-medium text-slate-500">Pro Plan</p>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="relative"
              aria-label="Account menu"
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="h-[38px] w-[38px] rounded-full ring-2 ring-slate-100 object-cover shadow-sm"
                />
              ) : (
                <div className="h-[38px] w-[38px] rounded-full bg-indigo-50 flex items-center justify-center text-notionix-primary font-bold shadow-sm ring-2 ring-slate-100">
                  {String(user.email || "u").charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full px-4 py-3 text-left text-[13px] font-bold text-slate-700 hover:bg-slate-50"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-4 pl-2">
            <a
              href={clientApiUrl("/api/auth/google")}
              className="inline-flex items-center justify-center rounded-full bg-notionix-primary px-5 py-2 text-[13px] font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-opacity-90 active:scale-95"
            >
              Sign in with Google
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
