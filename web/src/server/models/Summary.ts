import mongoose, { Schema, Document, Types } from "mongoose";

export type SummaryVisibility = "public" | "private";

export interface ISummary extends Document {
  userId: Types.ObjectId;
  platform: "ChatGPT" | "Claude" | "Gemini" | "Unknown" | string;
  title: string;
  summaryText: string;
  url: string;
  workspaceId?: Types.ObjectId;
  tags: Types.ObjectId[];
  visibility: SummaryVisibility;
  starred: boolean;
  shareEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SummarySchema = new Schema<ISummary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    platform: { type: String, required: true },
    title: { type: String, required: true },
    summaryText: { type: String, required: true },
    url: { type: String, required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    starred: { type: Boolean, default: false, index: true },
    shareEnabled: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

SummarySchema.index({ visibility: 1, createdAt: -1 });

export const Summary =
  (mongoose.models.Summary as mongoose.Model<ISummary>) ||
  mongoose.model<ISummary>("Summary", SummarySchema);
