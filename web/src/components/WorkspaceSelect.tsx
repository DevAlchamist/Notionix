"use client";

import { useEffect, useRef, useState } from "react";

export type WorkspaceOption = { id: string; name: string };

type WorkspaceSelectProps = {
  workspaces: WorkspaceOption[];
  value: string;
  onChange: (workspaceId: string) => void;
  personalLabel?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

export function WorkspaceSelect({
  workspaces,
  value,
  onChange,
  personalLabel = "Personal workspace",
  disabled,
  "aria-label": ariaLabel = "Target workspace",
}: WorkspaceSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
    }
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selectedLabel =
    value === ""
      ? personalLabel
      : (workspaces.find((w) => w.id === value)?.name ?? personalLabel);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border-0 bg-transparent py-1 pl-1 pr-0 text-left text-[15px] font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-[#4B5CC4]/30 disabled:opacity-50"
      >
        <span className="truncate">{selectedLabel}</span>
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
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[300] max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
        >
          <li role="presentation" className="px-1">
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`flex w-full rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors ${
                value === "" ? "bg-indigo-50 text-notionix-primary" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              {personalLabel}
            </button>
          </li>
          {workspaces.map((w) => (
            <li key={w.id} role="presentation" className="px-1">
              <button
                type="button"
                role="option"
                aria-selected={value === w.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(w.id);
                  setOpen(false);
                }}
                className={`flex w-full rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors ${
                  value === w.id ? "bg-indigo-50 text-notionix-primary" : "text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{w.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
