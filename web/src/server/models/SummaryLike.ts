import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISummaryLike extends Document {
  userId: Types.ObjectId;
  summaryId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SummaryLikeSchema = new Schema<ISummaryLike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    summaryId: { type: Schema.Types.ObjectId, ref: "Summary", required: true, index: true },
  },
  { timestamps: true },
);

SummaryLikeSchema.index({ summaryId: 1, userId: 1 }, { unique: true });

export const SummaryLike =
  (mongoose.models.SummaryLike as mongoose.Model<ISummaryLike>) ||
  mongoose.model<ISummaryLike>("SummaryLike", SummaryLikeSchema);
