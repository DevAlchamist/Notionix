import { clientApiUrl } from "@/lib/apiBase";

export async function patchSummaryStarred(
  id: string,
  starred: boolean,
): Promise<{ starred: boolean }> {
  const res = await fetch(clientApiUrl(`/api/summaries/${encodeURIComponent(id)}`), {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ starred }),
  });
  if (!res.ok) {
    throw new Error("Failed to update summary");
  }
  const data = await res.json();
  return { starred: Boolean(data?.starred) };
}

export async function patchWorkspaceStarred(
  id: string,
  starred: boolean,
): Promise<{ starred: boolean }> {
  const res = await fetch(clientApiUrl(`/api/workspaces/${encodeURIComponent(id)}`), {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ starred }),
  });
  if (!res.ok) {
    throw new Error("Failed to update workspace");
  }
  const data = await res.json();
  return { starred: Boolean(data?.starred) };
}
