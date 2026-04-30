import mongoose, { Document, Schema, Types } from "mongoose";
import type { ArmorIqMode, AuditEventV1 } from "@/server/security/types";

export interface IArmorIqAuditLog extends Document {
  userId: Types.ObjectId | string;
  userEmail?: string;
  mode: ArmorIqMode;
  emittedOk: boolean;
  reason?: string;
  provider: "armoriq";
  event: AuditEventV1;
  createdAt: Date;
  updatedAt: Date;
}

const ArmorIqAuditLogSchema = new Schema<IArmorIqAuditLog>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    userEmail: { type: String },
    mode: { type: String, enum: ["observe", "enforce"], required: true, default: "observe" },
    emittedOk: { type: Boolean, required: true },
    reason: { type: String },
    provider: { type: String, default: "armoriq", required: true },
    event: {
      type: new Schema(
        {
          eventType: { type: String, required: true, index: true },
          actorUserId: { type: String },
          targetType: { type: String, required: true },
          targetId: { type: String },
          result: { type: String, required: true },
          timestamp: { type: String, required: true },
          request: {
            method: { type: String, required: true },
            path: { type: String, required: true },
            ip: { type: String },
            userAgent: { type: String },
          },
          metadata: { type: Schema.Types.Mixed },
        },
        { _id: false },
      ),
      required: true,
    },
  },
  { timestamps: true },
);

ArmorIqAuditLogSchema.index({ createdAt: -1 });

export const ArmorIqAuditLog =
  (mongoose.models.ArmorIqAuditLog as mongoose.Model<IArmorIqAuditLog>) ||
  mongoose.model<IArmorIqAuditLog>("ArmorIqAuditLog", ArmorIqAuditLogSchema);

