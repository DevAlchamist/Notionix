"use client";

import { EntityStarButton } from "@/components/EntityStarButton";
import { clientApiUrl } from "@/lib/apiBase";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type WorkspaceTag = { _id?: string; id?: string; name?: string };
type WorkspaceItem = {
  id: string;
  name: string;
  description?: string;
  tags?: WorkspaceTag[];
  createdAt?: string;
  starred?: boolean;
  summaryCount?: number;
  summariesLength?: number;
};

function formatDateLabel(value?: string) {
  if (!value) return "Recently";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getWorkspaceAccent(index: number) {
  const accents = [
    { chip: "bg-indigo-100 text-indigo-700", icon: "bg-indigo-100 text-indigo-700" },
    { chip: "bg-sky-100 text-sky-700", icon: "bg-sky-100 text-sky-700" },
    { chip: "bg-violet-100 text-violet-700", icon: "bg-violet-100 text-violet-700" },
    { chip: "bg-cyan-100 text-cyan-700", icon: "bg-cyan-100 text-cyan-700" },
  ];
  return accents[index % accents.length];
}

export default function WorkspacesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [workspaceTags, setWorkspaceTags] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [workspaceLoadError, setWorkspaceLoadError] = useState<string | null>(null);

  const totalTags = useMemo(
    () =>
      workspaces.reduce((acc, workspace) => {
        return acc + (workspace.tags?.length ?? 0);
      }, 0),
    [workspaces],
  );

  async function loadWorkspaces() {
    setIsLoadingWorkspaces(true);
    setWorkspaceLoadError(null);
    try {
      const res = await fetch(clientApiUrl("/api/workspaces"), {
        credentials: "include",
      });
      if (!res.ok) {
        let message = "Unable to load workspaces.";
        try {
          const data = await res.json();
          if (typeof data?.error === "string" && data.error.length) {
            message = data.error;
          }
        } catch {
          // Keep fallback message.
        }
        throw new Error(message);
      }
      const data = await res.json();
      setWorkspaces(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load workspaces.";
      setWorkspaceLoadError(message);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }

  useEffect(() => {
    void loadWorkspaces();
  }, []);

  const updateWorkspaceStar = useCallback((workspaceId: string, starred: boolean) => {
    setWorkspaces((prev) => prev.map((w) => (w.id === workspaceId ? { ...w, starred } : w)));
  }, []);

  function openCreateModal() {
    setCreateError(null);
    setCreateSuccess(null);
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (isCreating) return;
    setIsCreateModalOpen(false);
  }

  async function handleCreateWorkspace(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = workspaceName.trim();
    if (!name) {
      setCreateError("Workspace name is required.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    const tags = workspaceTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch(clientApiUrl("/api/workspaces"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: workspaceDescription.trim() || undefined,
          tags,
        }),
      });

      if (!res.ok) {
        let message = "Failed to create workspace.";
        try {
          const data = await res.json();
          if (typeof data?.error === "string" && data.error.length) {
            message = data.error;
          }
        } catch {
          // Keep fallback error.
        }
        throw new Error(message);
      }

      setCreateSuccess("Workspace created successfully.");
      setWorkspaceName("");
      setWorkspaceDescription("");
      setWorkspaceTags("");
      setIsCreateModalOpen(false);
      await loadWorkspaces();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create workspace.";
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto w-full">
      <div className="mx-auto max-w-[1200px] px-4 py-8 pb-28 sm:px-6 md:px-12 md:py-12 md:pb-32">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-6">
          <div className="max-w-2xl">
            <h1 className="text-[28px] font-extrabold text-[#1e293b] tracking-tight mb-2">
              Space
            </h1>
            <p className="text-[17px] font-medium text-[#5e6b7c] leading-relaxed">
              Organize your collective knowledge into focused project environments. Link summaries, chats, and neural nodes here.
            </p>
          </div>
          
          <button
            onClick={openCreateModal}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#4B5CC4] px-6 py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:bg-[#3f4dac] active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5v14"/>
            </svg>
            New Space
          </button>
        </header>

        {createSuccess ? (
          <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            {createSuccess}
          </p>
        ) : null}

        {workspaceLoadError ? (
          <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
            {workspaceLoadError}
          </p>
        ) : null}

        {isLoadingWorkspaces ? (
          <div className="mb-12 rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-500">
            Loading workspaces...
          </div>
        ) : null}

        {!isLoadingWorkspaces && workspaces.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
              {workspaces.map((workspace, index) => {
                const accent = getWorkspaceAccent(index);
                const tags = (workspace.tags ?? []).slice(0, 2);
                return (
                  <div key={workspace.id} className="relative">
                  <Link
                    href={`/dashboard/workspaces/${workspace.id}`}
                    className="block rounded-[16px] border border-slate-200/80 bg-white p-5 pr-12 shadow-[0_2px_12px_rgb(0,0,0,0.02)] transition-all hover:border-indigo-200/80 hover:shadow-[0_8px_26px_rgb(0,0,0,0.05)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4B5CC4]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${accent.icon}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>
                      </div>
                    </div>

                    <h3 className="text-[24px] font-bold leading-tight tracking-tight text-slate-800 line-clamp-1 sm:text-[30px]">
                      {workspace.name}
                    </h3>
                    <p className="mt-2 text-[15px] text-slate-500 leading-relaxed line-clamp-2 min-h-[44px]">
                      {workspace.description?.trim() || "No description yet. Add details to define this workspace context."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 min-h-[28px]">
                      {tags.length > 0 ? (
                        tags.map((tag) => (
                          <span
                            key={`${workspace.id}-${tag._id || tag.id || tag.name}`}
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase ${accent.chip}`}
                          >
                            {(tag.name || "tag").slice(0, 14)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-slate-100 text-slate-500 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase">
                          No Tags
                        </span>
                      )}
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4 flex items-center gap-7">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Summaries</p>
                        <p className="text-[22px] font-extrabold text-slate-800 leading-none mt-1">
                          {workspace.summaryCount ?? workspace.summariesLength ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Last Activity</p>
                        <p className="text-[22px] font-extrabold text-slate-800 leading-none mt-1">
                          {formatDateLabel(workspace.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="absolute right-3 top-3 z-10">
                    <EntityStarButton
                      kind="workspace"
                      id={workspace.id}
                      initialStarred={workspace.starred === true}
                      iconClassName="h-4 w-4"
                      onStarredChange={(starred) => updateWorkspaceStar(workspace.id, starred)}
                    />
                  </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-[16px] border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 min-h-[264px] flex flex-col items-center justify-center text-center hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
              >
                <div className="h-11 w-11 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-2xl mb-3">+</div>
                <p className="text-[24px] font-bold leading-tight text-slate-700 sm:text-[30px]">New Space</p>
                <p className="mt-2 text-sm text-slate-500">Start a fresh context for your ideas.</p>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 mb-6">
              <div className="rounded-[12px] bg-[#eef1f4] border border-slate-200/70 p-6">
                <p className="text-[12px] font-bold tracking-[0.12em] text-[#4B5CC4] uppercase">Memory Health</p>
                <p className="mt-3 text-[30px] font-bold leading-tight text-slate-800 sm:text-[36px]">
                  You have <span className="text-[#4B5CC4]">{workspaces.length}</span> active spaces.
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-[10px] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Most Active</p>
                    <p className="text-[16px] font-bold text-slate-700 mt-1 line-clamp-1">{workspaces[0]?.name}</p>
                  </div>
                  <div className="rounded-[10px] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Tags Indexed</p>
                    <p className="text-[16px] font-bold text-[#4B5CC4] mt-1">+{totalTags}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[12px] bg-[#4B3FC9] text-white p-6 flex flex-col justify-between">
                <div>
                  <p className="text-[12px] font-bold tracking-[0.12em] text-white/80 uppercase">AI Insights</p>
                  <p className="mt-4 text-lg leading-snug font-semibold">
                    Your workspace graph is growing. Consider linking related summaries across Spaces.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-5 w-full rounded-[10px] bg-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 transition-colors"
                >
                  Review Bridge
                </button>
              </div>
            </div>
          </>
        ) : null}

        {!isLoadingWorkspaces && workspaces.length === 0 ? (
          <div className="mb-12 rounded-[20px] border border-slate-200/80 bg-white p-8 text-center">
            <h3 className="text-lg font-bold text-slate-800">No workspaces yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Click New Space to create your first workspace.
            </p>
          </div>
        ) : null}

      </div>

      {isCreateModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 mb-1">
              Create Space
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Add Space details to organize summaries.
            </p>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Product Roadmap Q2"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#4B5CC4] focus:ring-2 focus:ring-[#4B5CC4]/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  Description
                </label>
                <textarea
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  placeholder="What is this workspace about?"
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#4B5CC4] focus:ring-2 focus:ring-[#4B5CC4]/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                  Tags
                </label>
                <input
                  type="text"
                  value={workspaceTags}
                  onChange={(e) => setWorkspaceTags(e.target.value)}
                  placeholder="research, planning, launch"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#4B5CC4] focus:ring-2 focus:ring-[#4B5CC4]/20"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Separate tags with commas.
                </p>
              </div>

              {createError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createError}
                </p>
              ) : null}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreating}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-[#4B5CC4] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                >
                  {isCreating ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
