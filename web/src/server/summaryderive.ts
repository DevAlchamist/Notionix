/** Headings ChatGPT / similar models often put on the first lines — not useful as DB title. */
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

export function deriveSummaryTitle(summaryText: string, maxLen = 120): string {
  const rawLines = summaryText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const raw of rawLines) {
    const inline = raw.match(/^title\s*:\s*(.+)$/i);
    if (inline?.[1]) {
      const rest = inline[1].trim().replace(/[:：]\s*$/, "");
      if (rest.length >= 3 && !GENERIC_HEADING.test(normalizeSummaryLine(rest))) {
        return rest.slice(0, maxLen);
      }
      continue;
    }

    const line = normalizeSummaryLine(raw);
    if (line.length < 4) continue;
    if (GENERIC_HEADING.test(line)) continue;
    return line.slice(0, maxLen);
  }

  for (const raw of rawLines) {
    if (raw.length < 4) continue;
    if (lineLooksLikeLabelOnly(raw)) continue;
    return normalizeSummaryLine(raw).slice(0, maxLen) || raw.slice(0, maxLen);
  }

  const fallback = rawLines.map((r) => normalizeSummaryLine(r)).find((l) => l.length > 0) ?? "";
  return (fallback || "AI Conversation Summary").slice(0, maxLen);
}

export function isPlaceholderSummaryTitle(title: string): boolean {
  const t = title.trim();
  if (t.length < 2) return true;
  if (/^ai conversation summary$/i.test(t)) return true;
  const normalized = normalizeSummaryLine(t);
  if (GENERIC_HEADING.test(normalized)) return true;
  return false;
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

export function extractTitleAndSummary(summaryText: string): { title: string | null; summaryText: string } {
  const raw = String(summaryText ?? "").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");
  const titleLine = lines.find((l) =>
    /^\s*\*{0,2}\s*title\s*\*{0,2}\s*[:：\-–—]\s*\S+/i.test(String(l ?? "")),
  );

  let extractedTitle: string | null = null;
  if (titleLine) {
    const m = String(titleLine)
      .trim()
      .match(/^\*{0,2}\s*title\s*\*{0,2}\s*[:：\-–—]\s*(.+?)\s*$/i);
    if (m?.[1]) extractedTitle = m[1].trim();
  }

  return { title: extractedTitle && extractedTitle.length ? extractedTitle : null, summaryText: sanitizeSummaryText(raw) };
}
