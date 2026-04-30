"use client";

import { useEffect, useMemo, useState } from "react";

type AuditItem = {
  id: string;
  createdAt: string;
  mode: "observe" | "enforce";
  emittedOk: boolean;
  reason?: string;
  userEmail?: string;
  event: {
    eventType: string;
    actorUserId?: string;
    targetType: string;
    targetId?: string;
    result: string;
    timestamp: string;
    request: { method: string; path: string; ip?: string; userAgent?: string };
    metadata?: Record<string, unknown>;
  };
};

export default function ArmorIqAuditTempPage() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/armoriq/audits?limit=150", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(body || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { items?: AuditItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError((e as Error)?.message || "Failed to load ArmorIQ logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const ok = items.filter((x) => x.emittedOk).length;
    const failed = total - ok;
    return { total, ok, failed };
  }, [items]);

  return (
    <main className="min-h-0 w-full flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1200px] px-4 py-8 pb-24 sm:px-6 md:px-10 lg:px-12">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">ArmorIQ Audit Logs (Temp)</h1>
            <p className="mt-1 text-sm text-slate-600">
              Local DB-backed view of ArmorIQ audit emission attempts and payloads.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total" value={String(stats.total)} />
          <StatCard label="Emitted OK" value={String(stats.ok)} />
          <StatCard label="Emission Failed" value={String(stats.failed)} />
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading ArmorIQ logs...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error && items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No ArmorIQ audit entries found yet. Trigger login/mutation actions and refresh.
          </div>
        ) : null}

        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                  {item.event.eventType}
                </span>
                <span
                  className={`rounded px-2 py-1 font-semibold ${
                    item.emittedOk ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {item.emittedOk ? "ok" : "failed"}
                </span>
                <span className="rounded bg-indigo-100 px-2 py-1 font-semibold text-indigo-700">{item.mode}</span>
                <span className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
              </div>

              <p className="text-sm text-slate-700">
                <span className="font-semibold">Target:</span> {item.event.targetType}
                {item.event.targetId ? ` / ${item.event.targetId}` : ""}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Request:</span> {item.event.request.method} {item.event.request.path}
              </p>
              {item.reason ? (
                <p className="mt-1 text-sm text-rose-700">
                  <span className="font-semibold">Reason:</span> {item.reason}
                </p>
              ) : null}

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">Payload</summary>
                <pre className="mt-2 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
                  {JSON.stringify(item.event, null, 2)}
                </pre>
              </details>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

