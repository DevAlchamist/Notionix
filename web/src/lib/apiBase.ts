/** Browser / client components: empty string = same-origin relative `/api/...`. */
export function clientApiOrigin(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
}

export function clientApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = clientApiOrigin();
  return base ? `${base}${p}` : p;
}

/** Server Components / Route Handlers: infer current deployment origin from request headers. */
export async function serverApiOrigin(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // outside request context
  }
  const env = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return "http://localhost:3000";
}

export async function serverApiUrl(path: string): Promise<string> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = await serverApiOrigin();
  return `${base}${p}`;
}
