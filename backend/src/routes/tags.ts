import express from "express";
import mongoose from "mongoose";
import { Tag } from "../models/Tag";
import { Summary } from "../models/Summary";

const router = express.Router();

function escapeRegex(raw: string): string {
  return raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/tags/suggest", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = String((req.query.query as string | undefined) ?? "")
    .replace(/^#/, "")
    .trim()
    .replace(/\s+/g, " ");
  const rawLimit = parseInt(String(req.query.limit ?? "10"), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 10;

  const userObjectId =
    mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
  if (!userObjectId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const popularAgg = await Summary.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
          lastUsedAt: { $max: "$updatedAt" },
        },
      },
      { $sort: { count: -1, lastUsedAt: -1 } },
      { $limit: limit },
    ]);

    const popularIds = popularAgg
      .map((r: { _id: mongoose.Types.ObjectId }) => r._id)
      .filter(Boolean);

    const tagRowsById = new Map<string, { id: string; name: string; color?: string }>();
    if (popularIds.length) {
      const docs = await Tag.find({ userId: userObjectId, _id: { $in: popularIds } })
        .select("_id name color")
        .lean();
      for (const t of docs) {
        const id = t._id.toString();
        tagRowsById.set(id, { id, name: t.name, color: t.color });
      }
    }

    const popularItems = popularAgg
      .map((r: { _id: mongoose.Types.ObjectId; count: number }) => {
        const id = r._id?.toString?.() ?? "";
        const tag = tagRowsById.get(id);
        if (!tag) return null;
        return { ...tag, count: r.count };
      })
      .filter(Boolean) as Array<{ id: string; name: string; color?: string; count: number }>;

    let matchItems: Array<{ id: string; name: string; color?: string }> = [];
    if (query) {
      const rx = new RegExp(escapeRegex(query), "i");
      const docs = await Tag.find({ userId: userObjectId, name: rx })
        .sort({ name: 1 })
        .limit(limit)
        .select("_id name color")
        .lean();
      matchItems = docs.map((t) => ({
        id: t._id.toString(),
        name: t.name,
        color: t.color,
      }));
    }

    const seen = new Set<string>();
    const merged: Array<{ id: string; name: string; color?: string; count?: number }> = [];

    for (const item of matchItems) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
      if (merged.length >= limit) break;
    }

    if (merged.length < limit) {
      for (const item of popularItems) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        merged.push(item);
        if (merged.length >= limit) break;
      }
    }

    return res.json({ items: merged });
  } catch {
    return res.status(500).json({ error: "Failed to suggest tags" });
  }
});

router.post("/tags", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, color } = req.body as { name?: string; color?: string };

  if (!name) {
    return res.status(400).json({ error: "Missing required field: name" });
  }

  try {
    const docData: any = { userId, name };
    if (color !== undefined) docData.color = color;
    const doc = await Tag.create(docData);
    res.status(201).json({ id: doc.id, name: doc.name, color: doc.color });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Tag already exists" });
    }
    res.status(500).json({ error: "Failed to create tag" });
  }
});

router.get("/tags", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const items = await Tag.find({ userId }).sort({ name: 1 }).lean();

  res.json({
    items: items.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      color: t.color,
    })),
  });
});

router.delete("/tags/:id", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const id = req.params.id;
  await Tag.deleteOne({ _id: id, userId });
  res.status(204).send();
});

export default router;
