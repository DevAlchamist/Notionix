import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISavedSummary extends Document {
  userId: Types.ObjectId;
  summaryId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SavedSummarySchema = new Schema<ISavedSummary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    summaryId: { type: Schema.Types.ObjectId, ref: "Summary", required: true, index: true },
  },
  { timestamps: true },
);

SavedSummarySchema.index({ userId: 1, summaryId: 1 }, { unique: true });

export const SavedSummary =
  (mongoose.models.SavedSummary as mongoose.Model<ISavedSummary>) ||
  mongoose.model<ISavedSummary>("SavedSummary", SavedSummarySchema);
