import express from "express";
import mongoose from "mongoose";
import { Workspace } from "../models/Workspace";
import { Summary } from "../models/Summary";
import { Tag } from "../models/Tag";

const router = express.Router();

function workspaceStarred(doc: { starred?: boolean }): boolean {
  return doc.starred === true;
}

function summaryStarred(doc: { starred?: boolean }): boolean {
  return doc.starred === true;
}

async function resolveWorkspaceTagIds(userId: string, tagsInput?: string[]) {
  if (!Array.isArray(tagsInput) || tagsInput.length === 0) return [];

  const resolvedIds: string[] = [];

  for (const rawTag of tagsInput) {
    const value = String(rawTag ?? "").trim();
    if (!value) continue;

    // Keep compatibility for clients that already pass ObjectId strings.
    if (mongoose.Types.ObjectId.isValid(value)) {
      resolvedIds.push(value);
      continue;
    }

    const existing = await Tag.findOne({ userId, name: value }).lean();
    if (existing?._id) {
      resolvedIds.push(existing._id.toString());
      continue;
    }

    const created = await Tag.create({ userId, name: value });
    resolvedIds.push(created._id.toString());
  }

  return resolvedIds;
}

router.post("/workspaces", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, description, tags } = req.body as {
    name?: string;
    description?: string;
    tags?: string[];
  };

  if (!name) {
    return res.status(400).json({ error: "Missing required field: name" });
  }

  try {
    const tagIds = await resolveWorkspaceTagIds(userId, tags);
    const docData: any = { userId, name, tags: tagIds };
    if (description !== undefined) docData.description = description;

    const doc = await Workspace.create(docData);

    res.status(201).json({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      tags: doc.tags,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create workspace" });
  }
});

router.get("/workspaces", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const workspaceQuery: any = { userId };
  if (req.query.starred === "true" || req.query.starred === "1") {
    workspaceQuery.starred = true;
  }

  const items = await Workspace.find(workspaceQuery)
    .populate("tags", "name color")
    .sort({ createdAt: -1 })
    .lean();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : null;

  const summaryCounts = userObjectId
    ? await Summary.aggregate([
        {
          $match: {
            userId: userObjectId,
            workspaceId: { $exists: true, $ne: null },
          },
        },
        { $group: { _id: "$workspaceId", count: { $sum: 1 } } },
      ])
    : [];

  const summaryCountByWorkspaceId = new Map(
    summaryCounts.map((entry: { _id: unknown; count: number }) => [String(entry._id), entry.count]),
  );

  res.json({
    items: items.map((w) => {
      const count = summaryCountByWorkspaceId.get(w._id.toString()) ?? 0;
      return {
        id: w._id.toString(),
        name: w.name,
        description: w.description,
        tags: w.tags,
        createdAt: w.createdAt,
        starred: workspaceStarred(w as { starred?: boolean }),
        summaryCount: count,
        summariesLength: count,
      };
    }),
  });
});

router.get("/workspaces/:id", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  const doc = await Workspace.findOne({ _id: id, userId }).populate("tags", "name color").lean();

  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  // Optionally fetch summaries for this workspace
  const summaries = await Summary.find({ workspaceId: doc._id, userId }).sort({ createdAt: -1 }).lean();

  const previewFromText = (text: string, max = 220) => {
    const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
    if (normalized.length <= max) return normalized;
    return `${normalized.slice(0, max - 1).trimEnd()}…`;
  };

  const summaryCount = summaries.length;

  res.json({
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    tags: doc.tags,
    createdAt: doc.createdAt,
    starred: workspaceStarred(doc as { starred?: boolean }),
    summaryCount,
    summariesLength: summaryCount,
    summaries: summaries.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      platform: s.platform,
      createdAt: s.createdAt,
      url: s.url,
      preview: previewFromText(s.summaryText),
      visibility: (s as { visibility?: string }).visibility === "public" ? "public" : "private",
      starred: summaryStarred(s as { starred?: boolean }),
    })),
  });
});

router.put("/workspaces/:id", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  const { name, description, tags, starred } = req.body as {
    name?: string;
    description?: string;
    tags?: string[];
    starred?: boolean;
  };

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (tags !== undefined) {
    updateData.tags = await resolveWorkspaceTagIds(userId, tags);
  }
  if (starred !== undefined) {
    if (typeof starred !== "boolean") {
      return res.status(400).json({ error: "starred must be a boolean" });
    }
    updateData.starred = starred;
  }

  const doc = await Workspace.findOneAndUpdate(
    { _id: id, userId },
    { $set: updateData },
    { new: true }
  ).populate("tags", "name color").lean();

  if (!doc) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json({
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    tags: doc.tags,
    starred: workspaceStarred(doc as { starred?: boolean }),
  });
});

router.delete("/workspaces/:id", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  
  // Detach summaries from this workspace before deletion
  await Summary.updateMany({ workspaceId: id, userId }, { $unset: { workspaceId: 1 } });
  
  await Workspace.deleteOne({ _id: id, userId });
  res.status(204).send();
});

export default router;
