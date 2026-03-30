"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { WorkspaceSelect, type WorkspaceOption } from "@/components/WorkspaceSelect";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const DEFAULT_TAGS = ["Product Strategy", "AI Insights"];

const KNOWN_PLATFORMS = ["ChatGPT", "Claude", "Gemini", "Unknown"] as const;

function tagNamesFromSummary(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const names: string[] = [];
  for (const t of tags) {
    if (typeof t === "object" && t !== null && "name" in t) {
      const n = String((t as { name: string }).name ?? "").trim();
      if (n) names.push(n);
    }
  }
  return names;
}

function normalizePlatformForSelect(p: string): string {
  const s = (p ?? "").trim();
  if (KNOWN_PLATFORMS.includes(s as (typeof KNOWN_PLATFORMS)[number])) return s;
  const lower = s.toLowerCase();
  if (lower.includes("chatgpt") || lower.includes("openai")) return "ChatGPT";
  if (lower.includes("claude")) return "Claude";
  if (lower.includes("gemini")) return "Gemini";
  return s || "Unknown";
}

function detectPlatform(url: string): string {
  try {
    const { hostname } = new URL(url.trim());
    if (hostname.includes("chat.openai.com") || hostname.includes("chatgpt.com")) return "ChatGPT";
    if (hostname.includes("claude.ai")) return "Claude";
    if (hostname.includes("gemini.google.com")) return "Gemini";
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

async function ensureTagIds(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    try {
      const createRes = await fetch(`${API_BASE_URL}/api/tags`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (createRes.ok) {
        const d = await createRes.json();
        if (d?.id) ids.push(d.id);
        continue;
      }
      const listRes = await fetch(`${API_BASE_URL}/api/tags`, { credentials: "include" });
      if (listRes.ok) {
        const data = await listRes.json();
        const existing = (data.items ?? []).find((t: { name: string }) => t.name === name);
        if (existing?.id) ids.push(existing.id);
      }
    } catch {
      /* skip tag */
    }
  }
  return ids;
}

export function CaptureClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit")?.trim() || null;

  const skipUrlPlatformSync = useRef(false);
  const tagSuggestTimer = useRef<number | null>(null);
  const tagSuggestAbort = useRef<AbortController | null>(null);

  const [title, setTitle] = useState("");
  const [summaryText, setSummaryText] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("Unknown");
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS);
  const [tagSuggestions, setTagSuggestions] = useState<Array<{ id: string; name: string; count?: number }>>(
    [],
  );
  const [tagsSuggestError, setTagsSuggestError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "private">("private");

  useEffect(() => {
    if (skipUrlPlatformSync.current) {
      skipUrlPlatformSync.current = false;
      return;
    }
    const inf = detectPlatform(url);
    if (url.trim() && inf !== "Unknown") setPlatform(inf);
  }, [url]);

  useEffect(() => {
    if (!editId) {
      setTitle("");
      setSummaryText("");
      setUrl("");
      setPlatform("Unknown");
      setWorkspaceId("");
      setTags(DEFAULT_TAGS);
      setEditLoadError(null);
      setEditLoading(false);
      setSaveError(null);
      setFileHint(null);
      setVisibility("private");
      return;
    }

    let cancelled = false;
    (async () => {
      setEditLoading(true);
      setEditLoadError(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/summaries/${encodeURIComponent(editId)}`,
          { credentials: "include" },
        );
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Not found" : "Failed to load");
        }
        const data = await res.json();
        if (cancelled) return;
        skipUrlPlatformSync.current = true;
        setTitle(String(data.title ?? ""));
        setSummaryText(String(data.summaryText ?? ""));
        setUrl(String(data.url ?? ""));
        const rawPlatform = String(data.platform ?? "Unknown");
        setPlatform(normalizePlatformForSelect(rawPlatform));
        setWorkspaceId(data.workspaceId ? String(data.workspaceId) : "");
        setVisibility(data.visibility === "public" ? "public" : "private");
        const names = tagNamesFromSummary(data.tags);
        setTags(names.length ? names : []);
      } catch {
        if (!cancelled) setEditLoadError("Could not load this memory. It may have been removed.");
      } finally {
        if (!cancelled) setEditLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/workspaces`, { credentials: "include" });
        if (!res.ok) throw new Error("Workspaces unavailable");
        const data = await res.json();
        const items = (data.items ?? []).map((w: { id: string; name: string }) => ({
          id: w.id,
          name: w.name,
        }));
        if (!cancelled) setWorkspaces(items);
      } catch {
        if (!cancelled) setLoadError("Could not load workspaces. You can still save without a project.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addTag = useCallback((raw: string) => {
    const t = raw.replace(/^#/, "").trim().replace(/\s+/g, " ");
    if (!t) return;
    setTags((prev) => (prev.some((x) => x.toLowerCase() === t.toLowerCase()) ? prev : [...prev, t]));
    setTagInput("");
  }, []);

  useEffect(() => {
    const q = tagInput.replace(/^#/, "").trim().replace(/\s+/g, " ");

    if (tagSuggestTimer.current) {
      window.clearTimeout(tagSuggestTimer.current);
      tagSuggestTimer.current = null;
    }
    if (tagSuggestAbort.current) {
      tagSuggestAbort.current.abort();
      tagSuggestAbort.current = null;
    }

    tagSuggestTimer.current = window.setTimeout(() => {
      const controller = new AbortController();
      tagSuggestAbort.current = controller;
      setTagsSuggestError(null);
      fetch(
        `${API_BASE_URL}/api/tags/suggest?query=${encodeURIComponent(q)}&limit=12`,
        {
          credentials: "include",
          signal: controller.signal,
        },
      )
        .then(async (res) => {
          if (!res.ok) throw new Error("Suggestions unavailable");
          const data = await res.json();
          const items = Array.isArray(data?.items) ? data.items : [];
          const normalized = items
            .map((it: any) => ({
              id: String(it?.id ?? ""),
              name: String(it?.name ?? "").trim(),
              count: typeof it?.count === "number" ? it.count : undefined,
            }))
            .filter((it: { id: string; name: string }) => it.id && it.name);
          setTagSuggestions(normalized);
        })
        .catch((err) => {
          if (err?.name === "AbortError") return;
          setTagSuggestions([]);
          setTagsSuggestError("Tag suggestions unavailable right now.");
        })
        .finally(() => {
          if (tagSuggestAbort.current === controller) tagSuggestAbort.current = null;
        });
    }, 250);

    return () => {
      if (tagSuggestTimer.current) {
        window.clearTimeout(tagSuggestTimer.current);
        tagSuggestTimer.current = null;
      }
      if (tagSuggestAbort.current) {
        tagSuggestAbort.current.abort();
        tagSuggestAbort.current = null;
      }
    };
  }, [tagInput]);

  const removeTag = useCallback((t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  }, []);

  function discardDraft() {
    setSaveError(null);
    setFileHint(null);
    if (editId) {
      router.push(`/dashboard/summaries/${editId}`);
      return;
    }
    setTitle("");
    setSummaryText("");
    setUrl("");
    setPlatform("Unknown");
    setWorkspaceId("");
    setVisibility("private");
    setTags(DEFAULT_TAGS);
    router.push("/dashboard");
  }

  async function handleBulkFiles(files: FileList | null) {
    if (!files?.length) return;
    setFileHint(null);
    const chunks: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text().catch(() => "");
      if (text.trim()) chunks.push(`--- ${file.name} ---\n${text.trim()}`);
    }
    if (chunks.length) {
      setSummaryText((prev) => (prev.trim() ? `${prev.trim()}\n\n` : "") + chunks.join("\n\n"));
      setFileHint(`Imported ${chunks.length} file(s). Review and edit below.`);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const st = summaryText.trim();
    const u = url.trim();
    if (!st) {
      setSaveError("Conversation summary is required.");
      return;
    }
    if (!u) {
      setSaveError("Source URL is required.");
      return;
    }
    let p = platform;
    if (p === "Unknown" && u) p = detectPlatform(u);

    setSaving(true);
    try {
      const tagIds = await ensureTagIds(tags);
      if (editId) {
        const res = await fetch(`${API_BASE_URL}/api/summaries/${encodeURIComponent(editId)}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            summaryText: st,
            url: u,
            platform: p,
            workspaceId: workspaceId || null,
            tags: tagIds,
            visibility,
          }),
        });
        if (!res.ok) {
          let msg = "Could not update memory.";
          try {
            const d = await res.json();
            if (typeof d?.error === "string") msg = d.error;
          } catch {
            /* noop */
          }
          throw new Error(msg);
        }
        router.push(`/dashboard/summaries/${editId}`);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/summaries`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: p,
          title: title.trim() || undefined,
          summaryText: st,
          url: u,
          workspaceId: workspaceId || undefined,
          tags: tagIds,
          visibility,
        }),
      });
      if (!res.ok) {
        let msg = "Could not save memory.";
        try {
          const d = await res.json();
          if (typeof d?.error === "string") msg = d.error;
        } catch {
          /* noop */
        }
        throw new Error(msg);
      }
      const data = await res.json();
      const id = data?.id as string | undefined;
      if (id) router.push(`/dashboard/summaries/${id}`);
      else router.push("/dashboard");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const isCustomPlatform =
    Boolean(platform) && !KNOWN_PLATFORMS.includes(platform as (typeof KNOWN_PLATFORMS)[number]);

  if (editId && editLoadError) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-10">
        <p className="text-[15px] font-medium text-red-800">{editLoadError}</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-[14px] font-semibold text-[#4B5CC4] hover:underline"
        >
          ← Back to Knowledge Hub
        </Link>
      </div>
    );
  }

  if (editId && editLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[15px] font-medium text-slate-500">
        Loading memory…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 pb-24 md:px-10 lg:px-12">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 md:text-[32px]">
            {editId ? "Edit Intelligence Capture" : "New Intelligence Capture"}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] font-medium leading-relaxed text-[#5e6b7c]">
            {editId
              ? "Update this memory’s title, summary, source, project, tags, and platform."
              : "Distill and store AI conversations into your long-term memory layer with semantic context."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <button
            type="button"
            onClick={discardDraft}
            className="text-[14px] font-semibold text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
          >
            {editId ? "Cancel" : "Discard Draft"}
          </button>
          <button
            type="submit"
            form="capture-form"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-[10px] bg-[#4B5CC4] px-6 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-[#3f4dac] disabled:opacity-60"
          >
            {saving ? "Saving…" : editId ? "Save changes" : "Save to Summaries"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] lg:gap-10">
        <div className="space-y-6">
          <form id="capture-form" onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-[16px] border border-slate-200/90 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6 flex items-center gap-2 text-[13px] font-bold text-slate-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4B5CC4]/10 text-[#4B5CC4]">
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
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
                Conversation Details
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Knowledge Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Q3 Marketing Architecture Session"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[15px] text-slate-800 outline-none ring-[#4B5CC4]/20 focus:border-[#4B5CC4] focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Conversation Summary
                  </label>
                  <textarea
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    placeholder="Paste the AI summary or key takeaways here…"
                    rows={8}
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed text-slate-800 outline-none ring-[#4B5CC4]/20 focus:border-[#4B5CC4] focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Source URL / Chat ID
                  </label>
                  <div className="flex rounded-xl border border-slate-200 focus-within:border-[#4B5CC4] focus-within:ring-2 focus-within:ring-[#4B5CC4]/20">
                    <span className="flex items-center border-r border-slate-200 px-3 text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://chat.openai.com/…"
                      className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-[15px] text-slate-800 outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-[12px] text-slate-500">
                    Platform is detected from the URL; override if needed.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    AI platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-medium text-slate-800 outline-none focus:border-[#4B5CC4] focus:ring-2 focus:ring-[#4B5CC4]/20"
                  >
                    {isCustomPlatform ? (
                      <option value={platform}>{platform}</option>
                    ) : null}
                    <option value="ChatGPT">ChatGPT</option>
                    <option value="Claude">Claude</option>
                    <option value="Gemini">Gemini</option>
                    <option value="Unknown">Other / Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Target Project
                  </label>
                  <div className="flex min-h-[48px] items-stretch rounded-xl border border-slate-200 bg-white focus-within:border-[#4B5CC4] focus-within:ring-2 focus-within:ring-[#4B5CC4]/20">
                    <span className="flex items-center border-r border-slate-200 px-3 text-slate-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                      </svg>
                    </span>
                    <div className="flex min-w-0 flex-1 items-center px-2 py-1">
                      <WorkspaceSelect
                        workspaces={workspaces}
                        value={workspaceId}
                        onChange={setWorkspaceId}
                        personalLabel="Personal workspace"
                        aria-label="Target project workspace"
                      />
                    </div>
                  </div>
                  {loadError ? (
                    <p className="mt-1.5 text-[12px] text-amber-700">{loadError}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Visibility
                  </label>
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                    <button
                      type="button"
                      onClick={() => setVisibility("private")}
                      className={`flex-1 rounded-lg py-2.5 text-[13px] font-bold transition ${
                        visibility === "private"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Private
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("public")}
                      className={`flex-1 rounded-lg py-2.5 text-[13px] font-bold transition ${
                        visibility === "public"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Public
                    </button>
                  </div>
                  <p className="mt-1.5 text-[12px] text-slate-500">
                    Public summaries can appear on the Social feed.
                  </p>
                </div>
              </div>
            </section>
          </form>

          <section
            className="rounded-[16px] border-2 border-dashed border-slate-200 bg-white p-8 text-center transition-colors hover:border-[#4B5CC4]/35 hover:bg-slate-50/50"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleBulkFiles(e.dataTransfer.files);
            }}
          >
            <h2 className="text-[17px] font-bold text-slate-900">Bulk Import AI Logs</h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-[#5e6b7c]">
              Drag and drop .json or .txt exports from ChatGPT, Claude, or Gemini here.
            </p>
            <label className="mt-5 inline-flex cursor-pointer text-[14px] font-bold text-[#4B5CC4] hover:underline">
              Browse files
              <input
                type="file"
                accept=".json,.txt,text/plain,application/json"
                multiple
                className="sr-only"
                onChange={(e) => void handleBulkFiles(e.target.files)}
              />
            </label>
            {fileHint ? <p className="mt-3 text-[13px] font-medium text-emerald-700">{fileHint}</p> : null}
          </section>

          {saveError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800">
              {saveError}
            </p>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-[16px] border border-slate-200/90 bg-white p-6 shadow-sm">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Semantic Tagging
            </h3>
            <div className="mt-4 flex gap-2">
              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 px-3 focus-within:border-[#4B5CC4] focus-within:ring-2 focus-within:ring-[#4B5CC4]/20">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Add tag…"
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#4B5CC4] hover:bg-slate-50"
                  aria-label="Add tag"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-[12px] font-semibold text-slate-700"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Suggested Tags
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tagSuggestions
                .filter((s) => !tags.some((t) => t.toLowerCase() === s.name.toLowerCase()))
                .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addTag(s.name)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-600 hover:border-[#4B5CC4]/40 hover:text-[#4B5CC4]"
                >
                  #{s.name}
                </button>
              ))}
            </div>
            {tagsSuggestError ? (
              <p className="mt-2 text-[12px] font-medium text-amber-700">{tagsSuggestError}</p>
            ) : null}
          </section>

          <div className="overflow-hidden rounded-[16px] bg-linear-to-br from-[#312e81] to-[#1e1b4b] p-6 text-white shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                ✦
              </span>
              <h3 className="text-[15px] font-bold">AI Enrichment Active</h3>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-indigo-100/90">
              We analyze your input to suggest memory clusters and cross-references as you save.
            </p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-indigo-200/80">
              Confidence Score
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-[94%] rounded-full bg-linear-to-r from-violet-300 to-indigo-200" />
            </div>
            <p className="mt-1 text-right text-[12px] font-semibold text-indigo-100">94%</p>
          </div>

          <div className="rounded-[16px] border border-slate-200/80 bg-slate-50 p-5">
            <div className="flex gap-3">
              <span className="text-xl" aria-hidden>
                💡
              </span>
              <p className="text-[14px] leading-relaxed text-slate-600">
                <span className="font-bold text-slate-800">Pro tip:</span> Mention other summaries by typing{" "}
                <code className="rounded bg-white px-1.5 py-0.5 text-[13px] font-mono text-[#4B5CC4]">
                  @title
                </code>{" "}
                in the summary field (coming soon).
              </p>
            </div>
          </div>

          <Link
            href={editId ? `/dashboard/summaries/${editId}` : "/dashboard"}
            className="block text-center text-[14px] font-semibold text-slate-500 hover:text-[#4B5CC4]"
          >
            {editId ? "← Back to memory" : "← Back to Knowledge Hub"}
          </Link>
        </aside>
      </div>
    </div>
  );
}
