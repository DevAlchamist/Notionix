/**
 * Parse extension-style AI summaries (section headers on their own line).
 */

const SECTION_HEADERS = [
  "title",
  "main topic",
  "key points",
  "important insights",
  "action items",
] as const;

export type ParsedSummarySection = {
  key: string;
  label: string;
  lines: string[];
};

export type ParsedSummary = {
  preamble: string[];
  sections: ParsedSummarySection[];
  raw: string;
};

function titleCaseHeader(key: string): string {
  return key
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function parseStructuredSummary(raw: string): ParsedSummary {
  const preamble: string[] = [];
  const sections: ParsedSummarySection[] = [];
  const headerSet = new Set<string>(SECTION_HEADERS);

  let currentKey: string | null = null;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    const asHeader = trimmed.toLowerCase();

    if (headerSet.has(asHeader)) {
      currentKey = asHeader;
      sections.push({
        key: asHeader,
        label: titleCaseHeader(asHeader),
        lines: [],
      });
      continue;
    }

    if (currentKey) {
      const block = sections[sections.length - 1];
      if (block) block.lines.push(line);
    } else {
      preamble.push(line);
    }
  }

  return { preamble, sections, raw };
}

// --- Title/Summary wrapper cleanup (defense for legacy/unsanitized content) ---

const GENERIC_HEADING =
  /^(title|summary|untitled|main topic|key points|important insights|action items|overview)(\s*\([^)]*\))?$/i;

function normalizeSummaryLine(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*(.+?)\*\*$/, "$1")
    .replace(/[:：]\s*$/, "")
    .trim();
}

function lineLooksLikeLabelOnly(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  const noColon = t.replace(/[:：]\s*$/, "").trim();
  return GENERIC_HEADING.test(noColon);
}

function stripLeadingTitleLines(summaryText: string): string {
  const lines = String(summaryText ?? "").split(/\r?\n/);
  let i = 0;

  const normalizedAt = (idx: number) => normalizeSummaryLine(String(lines[idx] ?? ""));

  while (i < lines.length && (lines[i] ?? "").trim().length === 0) i++;

  if (i < lines.length) {
    const raw = String(lines[i] ?? "").trim();
    const m = raw.match(/^\*{0,2}\s*title\s*\*{0,2}\s*[:：\-–—]\s*(.+)$/i);
    if (m?.[1] && m[1].trim().length > 0) {
      i++;
      while (i < lines.length && (lines[i] ?? "").trim().length === 0) i++;
    }
  }

  if (i < lines.length) {
    const raw = String(lines[i] ?? "").trim();
    const isHeading = /^#{1,6}\s+\S/.test(raw);
    if (isHeading && !GENERIC_HEADING.test(normalizeSummaryLine(raw))) {
      i++;
      while (i < lines.length && (lines[i] ?? "").trim().length === 0) i++;
    }
  }

  if (i < lines.length) {
    const raw = String(lines[i] ?? "").trim();
    if (raw && lineLooksLikeLabelOnly(raw)) {
      i++;
      while (i < lines.length && (lines[i] ?? "").trim().length === 0) i++;
    }
  }

  if (i < lines.length) {
    const raw = String(lines[i] ?? "").trim();
    if (/^\*{0,2}\s*summary\s*\*{0,2}\s*[:：]\s*$/i.test(raw)) {
      i++;
      while (i < lines.length && (lines[i] ?? "").trim().length === 0) i++;
    }
  }

  if (i + 1 < lines.length) {
    const first = normalizedAt(i);
    const secondRaw = String(lines[i + 1] ?? "").trim();
    const secondLooksLikeSummaryHeader = /^\*{0,2}\s*summary\s*\*{0,2}\s*[:：]\s*$/i.test(secondRaw);
    if (secondLooksLikeSummaryHeader && first.length >= 3 && first.length <= 140 && !GENERIC_HEADING.test(first)) {
      i += 2;
      while (i < lines.length && (lines[i] ?? "").trim().length === 0) i++;
    }
  }

  return lines.slice(i).join("\n").trim();
}

export function sanitizeSummaryText(summaryText: string): string {
  return stripLeadingTitleLines(summaryText);
}

export function formatCapturedAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return "Captured just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Captured ${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `Captured ${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `Captured ${day} day${day === 1 ? "" : "s"} ago`;
  return `Captured ${new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function platformCategoryBadge(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("chatgpt") || p.includes("openai")) return "AI CONVERSATION";
  if (p.includes("claude")) return "CLAUDE CHAT";
  if (p.includes("gemini")) return "GEMINI CHAT";
  return "MEMORY";
}

export function suggestTags(platform: string, title: string): string[] {
  const tags = new Set<string>();
  const p = platform.toLowerCase();
  if (p.includes("chatgpt")) tags.add("chatgpt");
  if (p.includes("claude")) tags.add("claude");
  if (p.includes("gemini")) tags.add("gemini");
  tags.add("summary");
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 2);
  words.forEach((w) => tags.add(w));
  return [...tags].slice(0, 6);
}

export function truncateUrl(url: string, max = 42): string {
  try {
    const u = new URL(url);
    const s = u.hostname + u.pathname;
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + "…";
  } catch {
    return url.length > max ? url.slice(0, max - 1) + "…" : url;
  }
}
