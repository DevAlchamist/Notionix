import mongoose, { Schema, Document, Types } from "mongoose";

const MAX_BODY = 2000;

export interface ISummaryComment extends Document {
  userId: Types.ObjectId;
  summaryId: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const SummaryCommentSchema = new Schema<ISummaryComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    summaryId: { type: Schema.Types.ObjectId, ref: "Summary", required: true, index: true },
    body: {
      type: String,
      required: true,
      maxlength: MAX_BODY,
    },
  },
  { timestamps: true },
);

SummaryCommentSchema.index({ summaryId: 1, createdAt: 1 });

export const SummaryComment =
  (mongoose.models.SummaryComment as mongoose.Model<ISummaryComment>) ||
  mongoose.model<ISummaryComment>("SummaryComment", SummaryCommentSchema);

export const SUMMARY_COMMENT_MAX_BODY = MAX_BODY;
