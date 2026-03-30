import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITag extends Document {
  userId: Types.ObjectId;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    color: { type: String },
  },
  { timestamps: true },
);

// Ensure a user cannot have duplicate tag names
TagSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Tag =
  (mongoose.models.Tag as mongoose.Model<ITag>) ||
  mongoose.model<ITag>("Tag", TagSchema);
