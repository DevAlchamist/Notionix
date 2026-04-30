import Link from "next/link";

export default function WorkspaceNotFound() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto w-full">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 md:px-12 md:py-16">
        <h1 className="text-xl font-extrabold text-slate-900">Workspace not found</h1>
        <p className="mt-2 text-sm text-slate-600">It may have been removed or you may not have access.</p>
        <Link
          href="/dashboard/workspaces"
          className="mt-6 inline-flex text-sm font-semibold text-[#4B5CC4] hover:underline"
        >
          ← Back to workspaces
        </Link>
      </div>
    </main>
  );
}
