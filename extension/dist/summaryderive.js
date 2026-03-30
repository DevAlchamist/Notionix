/** Headings ChatGPT / similar models often put on the first lines — not useful as DB title. */
const GENERIC_HEADING = /^(title|summary|untitled|main topic|key points|important insights|action items|overview)(\s*\([^)]*\))?$/i;
function normalizeSummaryLine(line) {
    return line
        .replace(/^#{1,6}\s+/, "")
        .replace(/^\*\*(.+?)\*\*$/, "$1")
        .replace(/[:：]\s*$/, "")
        .trim();
}
function lineLooksLikeLabelOnly(raw) {
    const t = raw.trim();
    if (!t)
        return true;
    const noColon = t.replace(/[:：]\s*$/, "").trim();
    return GENERIC_HEADING.test(noColon);
}
export function deriveSummaryTitle(summaryText, maxLen = 120) {
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
        if (line.length < 4)
            continue;
        if (GENERIC_HEADING.test(line))
            continue;
        return line.slice(0, maxLen);
    }
    for (const raw of rawLines) {
        if (raw.length < 4)
            continue;
        if (lineLooksLikeLabelOnly(raw))
            continue;
        return normalizeSummaryLine(raw).slice(0, maxLen) || raw.slice(0, maxLen);
    }
    const fallback = rawLines.map((r) => normalizeSummaryLine(r)).find((l) => l.length > 0) ?? "";
    return (fallback || "AI Conversation Summary").slice(0, maxLen);
}
function stripLeadingTitleLines(summaryText) {
    const lines = String(summaryText ?? "").split(/\r?\n/);
    let i = 0;
    const normalizedAt = (idx) => normalizeSummaryLine(String(lines[idx] ?? ""));
    // Drop leading blank lines.
    while (i < lines.length && (lines[i] ?? "").trim().length === 0)
        i++;
    // Drop a leading "Title: ..." style line.
    if (i < lines.length) {
        const raw = String(lines[i] ?? "").trim();
        // Handles: "Title: X", "**Title:** X", "TITLE - X"
        const m = raw.match(/^\*{0,2}\s*title\s*\*{0,2}\s*[:：\-–—]\s*(.+)$/i);
        if (m?.[1] && m[1].trim().length > 0) {
            i++;
            while (i < lines.length && (lines[i] ?? "").trim().length === 0)
                i++;
        }
    }
    // Drop a single leading heading that looks like a title.
    if (i < lines.length) {
        const raw = (lines[i] ?? "").trim();
        const isHeading = /^#{1,6}\s+\S/.test(raw);
        if (isHeading && !GENERIC_HEADING.test(normalizeSummaryLine(raw))) {
            i++;
            while (i < lines.length && (lines[i] ?? "").trim().length === 0)
                i++;
        }
    }
    // Drop a leading label-only line (e.g. "Title", "Summary", "Overview", etc).
    if (i < lines.length) {
        const raw = (lines[i] ?? "").trim();
        if (raw && lineLooksLikeLabelOnly(raw)) {
            i++;
            while (i < lines.length && (lines[i] ?? "").trim().length === 0)
                i++;
        }
    }
    // If the model returned a "Summary:" header, strip it too.
    if (i < lines.length) {
        const raw = String(lines[i] ?? "").trim();
        const m = raw.match(/^\*{0,2}\s*summary\s*\*{0,2}\s*[:：]\s*$/i);
        if (m) {
            i++;
            while (i < lines.length && (lines[i] ?? "").trim().length === 0)
                i++;
        }
    }
    // Safety: sometimes first line is a plain title (not labeled) followed by "Summary:".
    // If we see that pattern, drop the first line.
    if (i + 1 < lines.length) {
        const first = normalizedAt(i);
        const secondRaw = String(lines[i + 1] ?? "").trim();
        const secondLooksLikeSummaryHeader = /^\*{0,2}\s*summary\s*\*{0,2}\s*[:：]\s*$/i.test(secondRaw);
        if (secondLooksLikeSummaryHeader && first.length >= 3 && first.length <= 140 && !GENERIC_HEADING.test(first)) {
            i += 2;
            while (i < lines.length && (lines[i] ?? "").trim().length === 0)
                i++;
        }
    }
    return lines.slice(i).join("\n").trim();
}
export function sanitizeSummaryText(summaryText) {
    const stripped = stripLeadingTitleLines(summaryText);
    return stripped;
}
export function extractTitleAndSummary(summaryText) {
    const raw = String(summaryText ?? "").replace(/\r\n/g, "\n");
    const lines = raw.split("\n");
    // Find a labeled title line (supports markdown bold): "Title: X", "**Title:** X"
    const titleLine = lines.find((l) => /^\s*\*{0,2}\s*title\s*\*{0,2}\s*[:：\-–—]\s*\S+/i.test(String(l ?? "")));
    let extractedTitle = null;
    if (titleLine) {
        const m = String(titleLine)
            .trim()
            .match(/^\*{0,2}\s*title\s*\*{0,2}\s*[:：\-–—]\s*(.+?)\s*$/i);
        if (m?.[1])
            extractedTitle = m[1].trim();
    }
    // Remove title + summary headers from the body.
    const cleanedSummaryText = sanitizeSummaryText(raw);
    return { title: extractedTitle && extractedTitle.length ? extractedTitle : null, summaryText: cleanedSummaryText };
}
//# sourceMappingURL=summaryderive.js.map