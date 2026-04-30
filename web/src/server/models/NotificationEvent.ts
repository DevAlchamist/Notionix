import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationEventType = "like" | "comment" | "save";

export interface INotificationEvent extends Document {
  ownerId: Types.ObjectId;
  actorId: Types.ObjectId;
  summaryId: Types.ObjectId;
  eventType: NotificationEventType;
  commentId?: Types.ObjectId;
  seenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationEventSchema = new Schema<INotificationEvent>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    summaryId: { type: Schema.Types.ObjectId, ref: "Summary", required: true },
    eventType: { type: String, enum: ["like", "comment", "save"], required: true, index: true },
    commentId: { type: Schema.Types.ObjectId, ref: "SummaryComment" },
    seenAt: { type: Date, index: true },
  },
  { timestamps: true },
);

NotificationEventSchema.index({ ownerId: 1, createdAt: -1 });

export const NotificationEvent =
  (mongoose.models.NotificationEvent as mongoose.Model<INotificationEvent>) ||
  mongoose.model<INotificationEvent>("NotificationEvent", NotificationEventSchema);
