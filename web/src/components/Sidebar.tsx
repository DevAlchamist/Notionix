"use client";

import { clientApiUrl } from "@/lib/apiBase";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Sidebar() {
  const pathname = usePathname();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function signOut() {
    try {
      await fetch(clientApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.href = "/";
    }
  }

  const isSummaries =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/summaries");
  const isWorkspaces =
    pathname === "/dashboard/workspaces" || pathname.startsWith("/dashboard/workspaces/");
  const isSocial = pathname === "/dashboard/social" || pathname.startsWith("/dashboard/social/");
  const isCapture = pathname === "/dashboard/capture";
  const isBilling = pathname === "/dashboard/billing";

  return (
    <>
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-[#FCFCFD] px-4 py-6 md:flex">
      <div className="mb-10 pl-2">
        <h1 className="text-xl font-bold tracking-tight text-notionix-primary mb-1">
          Notionix
        </h1>
        <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
          Memory Layer
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            isSummaries
              ? "bg-indigo-50/80 text-notionix-primary"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
            <path d="M3 12A9 3 0 0 0 21 12"/>
          </svg>
          All Summaries
        </Link>
        <Link
          href="/dashboard/workspaces"
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            isWorkspaces
              ? "bg-indigo-50/80 text-notionix-primary"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
          </svg>
          Workspaces
        </Link>
        <Link
          href="/dashboard/social"
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            isSocial
              ? "bg-indigo-50/80 text-notionix-primary"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Social
        </Link>
        <Link
          href="/dashboard/social/saved"
          className="flex items-center gap-3 rounded-xl px-4 py-2 pl-11 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          Saved (feed)
        </Link>
        <Link
          href="#"
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Settings
        </Link>
        <Link
          href="/dashboard/billing"
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
            isBilling
              ? "bg-indigo-50/80 text-notionix-primary"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
          Billing
        </Link>
      </nav>

      <div className="mt-auto mb-6 px-2 flex flex-col gap-4">
        <Link
          href="/dashboard/capture"
          className={`flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 ${
            isCapture
              ? "bg-[#3f4dac] ring-2 ring-indigo-300 ring-offset-2 ring-offset-[#FCFCFD]"
              : "bg-[#4B5CC4]"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="M12 5v14"/>
          </svg>
          New Capture
        </Link>
      </div>

      <nav className="px-2 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setIsHelpModalOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
          </svg>
          Help
        </button>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          Sign out
        </button>
      </nav>
      {isMounted &&
        isHelpModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Need help?</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Choose how you want to contact us about the application.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  href="/support?type=bug"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Report a bug
                </Link>
                <Link
                  href="/support?type=report"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Report an issue
                </Link>
                <Link
                  href="/support?type=suggestion"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Share a suggestion
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="mt-4 w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>,
          document.body,
        )}
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center rounded-lg px-1 py-2 text-[11px] font-semibold ${
            isSummaries ? "bg-indigo-50 text-notionix-primary" : "text-slate-500"
          }`}
        >
          All
        </Link>
        <Link
          href="/dashboard/workspaces"
          className={`flex flex-col items-center justify-center rounded-lg px-1 py-2 text-[11px] font-semibold ${
            isWorkspaces ? "bg-indigo-50 text-notionix-primary" : "text-slate-500"
          }`}
        >
          Spaces
        </Link>
        <Link
          href="/dashboard/social"
          className={`flex flex-col items-center justify-center rounded-lg px-1 py-2 text-[11px] font-semibold ${
            isSocial ? "bg-indigo-50 text-notionix-primary" : "text-slate-500"
          }`}
        >
          Social
        </Link>
        <Link
          href="/dashboard/capture"
          className={`flex flex-col items-center justify-center rounded-lg px-1 py-2 text-[11px] font-semibold ${
            isCapture ? "bg-indigo-50 text-notionix-primary" : "text-slate-500"
          }`}
        >
          Capture
        </Link>
        <Link
          href="/dashboard/billing"
          className={`flex flex-col items-center justify-center rounded-lg px-1 py-2 text-[11px] font-semibold ${
            isBilling ? "bg-indigo-50 text-notionix-primary" : "text-slate-500"
          }`}
        >
          Billing
        </Link>
        <button
          type="button"
          onClick={() => setIsHelpModalOpen(true)}
          className="flex flex-col items-center justify-center rounded-lg px-1 py-2 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100"
        >
          Help
        </button>
      </div>
    </nav>
    </>
  );
}
