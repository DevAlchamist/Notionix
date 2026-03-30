import express from "express";
import { Summary, type SummaryVisibility } from "../models/Summary";
import { deriveSummaryTitle, extractTitleAndSummary, isPlaceholderSummaryTitle, sanitizeSummaryText } from "../summaryderive";
import { SummaryComment } from "../models/SummaryComment";
import { SummaryLike } from "../models/SummaryLike";
import { SavedSummary } from "../models/SavedSummary";
import { NotificationEvent } from "../models/NotificationEvent";
import { NotificationGroup } from "../models/NotificationGroup";

const router = express.Router();

function normalizeVisibility(value: unknown): SummaryVisibility {
  if (value === "public" || value === "private") return value;
  return "private";
}

function summaryStarred(doc: { starred?: boolean }): boolean {
  return doc.starred === true;
}

router.post("/summaries", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { platform, title, summaryText, url, createdAt, workspaceId, tags, visibility } = req.body as {
    platform?: string;
    title?: string;
    summaryText?: string;
    url?: string;
    createdAt?: string;
    workspaceId?: string;
    tags?: string[];
    visibility?: string;
  };

  if (!platform || !summaryText || !url) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const extracted = extractTitleAndSummary(summaryText);
  const cleanedSummaryText = sanitizeSummaryText(extracted.summaryText);

  let resolvedTitle = (title ?? "").trim();
  if (!resolvedTitle || isPlaceholderSummaryTitle(resolvedTitle)) {
    resolvedTitle = (extracted.title ?? "").trim() || deriveSummaryTitle(cleanedSummaryText);
  }

  const docData: any = {
    userId,
    platform,
    title: resolvedTitle,
    summaryText: cleanedSummaryText,
    url,
    tags: tags || [],
    visibility: normalizeVisibility(visibility),
    createdAt: createdAt ? new Date(createdAt) : new Date(),
  };
  if (workspaceId !== undefined) {
    docData.workspaceId = workspaceId;
  }

  const doc = await Summary.create(docData);

  res.status(201).json({ id: doc.id });
});

router.get("/summaries", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 50);

  const query: any = { userId };
  if (req.query.workspaceId) {
    query.workspaceId = req.query.workspaceId;
  }
  if (req.query.starred === "true" || req.query.starred === "1") {
    query.starred = true;
  }
  const items = await Summary.find(query)
    .populate("tags", "name color")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    items: items.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      platform: s.platform,
      workspaceId: s.workspaceId?.toString() || null,
      tags: s.tags || [],
      createdAt: s.createdAt,
      visibility: normalizeVisibility((s as { visibility?: string }).visibility),
      starred: summaryStarred(s as { starred?: boolean }),
    })),
  });
});

router.get("/summaries/:id", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  const doc = await Summary.findOne({ _id: id, userId }).populate("tags", "name color").lean();
  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    id: doc._id.toString(),
    title: doc.title,
    platform: doc.platform,
    summaryText: doc.summaryText,
    url: doc.url,
    workspaceId: doc.workspaceId?.toString() || null,
    tags: doc.tags || [],
    createdAt: doc.createdAt,
    visibility: normalizeVisibility((doc as { visibility?: string }).visibility),
    starred: summaryStarred(doc as { starred?: boolean }),
  });
});

router.post("/summaries/:id/share", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  const enabled = (req.body as { enabled?: unknown } | undefined)?.enabled;
  if (enabled !== true) {
    return res.status(400).json({ error: "enabled must be true" });
  }

  const doc = await Summary.findOneAndUpdate(
    { _id: id, userId },
    { $set: { shareEnabled: true } },
    { new: true },
  )
    .select("_id shareEnabled")
    .lean();

  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  return res.json({ ok: true });
});

router.get("/shared/summaries/:id", async (req, res) => {
  const id = req.params.id;
  const doc = await Summary.findOne({
    _id: id,
    $or: [{ shareEnabled: true }, { visibility: "public" }],
  }).lean();
  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    id: doc._id.toString(),
    title: doc.title,
    platform: doc.platform,
    summaryText: doc.summaryText,
    url: doc.url,
    createdAt: doc.createdAt,
  });
});

router.put("/summaries/:id", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  const { title, summaryText, platform, url, workspaceId, tags, visibility, starred } = req.body as {
    title?: string;
    summaryText?: string;
    platform?: string;
    url?: string;
    workspaceId?: string | null;
    tags?: string[];
    visibility?: string;
    starred?: boolean;
  };

  const updateData: any = {};

  // If summaryText is provided, sanitize it (strip Title/Summary wrappers) before saving.
  let cleanedIncomingSummaryText: string | undefined = undefined;
  let extractedIncomingTitle: string | null = null;
  if (summaryText !== undefined) {
    const extracted = extractTitleAndSummary(String(summaryText));
    cleanedIncomingSummaryText = sanitizeSummaryText(extracted.summaryText);
    extractedIncomingTitle = extracted.title;
    updateData.summaryText = cleanedIncomingSummaryText;
  }

  if (title !== undefined) {
    let resolvedTitle = title.trim();
    if (!resolvedTitle || isPlaceholderSummaryTitle(resolvedTitle)) {
      let baseText = cleanedIncomingSummaryText ?? summaryText;
      if (baseText === undefined) {
        const existing = await Summary.findOne({ _id: id, userId }).select("summaryText").lean();
        baseText = existing?.summaryText ?? "";
      }
      resolvedTitle = (extractedIncomingTitle ?? "").trim() || deriveSummaryTitle(String(baseText));
    }
    updateData.title = resolvedTitle;
  }
  if (platform !== undefined) updateData.platform = platform;
  if (url !== undefined) updateData.url = url;
  if (workspaceId !== undefined) {
    updateData.workspaceId = workspaceId && String(workspaceId).length ? workspaceId : null;
  }
  if (tags !== undefined) updateData.tags = tags;
  if (visibility !== undefined) updateData.visibility = normalizeVisibility(visibility);
  if (starred !== undefined) {
    if (typeof starred !== "boolean") {
      return res.status(400).json({ error: "starred must be a boolean" });
    }
    updateData.starred = starred;
  }

  const doc = await Summary.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true }
  ).populate("tags", "name color").lean();

  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    id: doc._id.toString(),
    title: doc.title,
    platform: doc.platform,
    summaryText: doc.summaryText,
    workspaceId: doc.workspaceId ? doc.workspaceId.toString() : null,
    tags: doc.tags || [],
    visibility: normalizeVisibility((doc as { visibility?: string }).visibility),
    starred: summaryStarred(doc as { starred?: boolean }),
  });
});

router.delete("/summaries/:id", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;

  const existing = await Summary.findOne({ _id: id, userId }).select("_id").lean();
  if (!existing) {
    return res.status(404).json({ error: "Not found" });
  }

  // Cascade-delete related social/history docs to avoid orphans.
  await Promise.all([
    SummaryComment.deleteMany({ summaryId: id }),
    SummaryLike.deleteMany({ summaryId: id }),
    SavedSummary.deleteMany({ summaryId: id }),
    NotificationEvent.deleteMany({ summaryId: id }),
    NotificationGroup.deleteMany({ summaryId: id }),
  ]);

  await Summary.deleteOne({ _id: id, userId });
  return res.status(204).send();
});

export default router;

