import mongoose, { Schema, Document, Types } from "mongoose";
import type { NotificationEventType } from "./NotificationEvent";

export interface INotificationGroup extends Document {
  ownerId: Types.ObjectId;
  summaryId: Types.ObjectId;
  eventType: NotificationEventType;
  count: number;
  lastActorIds: Types.ObjectId[];
  lastEventAt: Date;
  seenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationGroupSchema = new Schema<INotificationGroup>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    summaryId: { type: Schema.Types.ObjectId, ref: "Summary", required: true, index: true },
    eventType: { type: String, enum: ["like", "comment", "save"], required: true, index: true },
    count: { type: Number, required: true, default: 0 },
    lastActorIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastEventAt: { type: Date, required: true, index: true },
    seenAt: { type: Date, index: true },
  },
  { timestamps: true },
);

NotificationGroupSchema.index({ ownerId: 1, lastEventAt: -1 });
NotificationGroupSchema.index({ ownerId: 1, summaryId: 1, eventType: 1 }, { unique: true });

export const NotificationGroup =
  (mongoose.models.NotificationGroup as mongoose.Model<INotificationGroup>) ||
  mongoose.model<INotificationGroup>("NotificationGroup", NotificationGroupSchema);
