import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWorkspace extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  tags: Types.ObjectId[];
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    starred: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export const Workspace =
  (mongoose.models.Workspace as mongoose.Model<IWorkspace>) ||
  mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);
