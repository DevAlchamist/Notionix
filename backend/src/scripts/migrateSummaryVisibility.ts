/**
 * One-shot migration: set summary.visibility to "private" for documents
 * missing the field, null, or any value other than "public" | "private".
 *
 * Run from backend/: npm run migrate:summary-visibility
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Summary } from "../models/Summary";

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    console.error("MONGO_URI is not set. Add it to backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const filter = {
    $or: [
      { visibility: { $exists: false } },
      { visibility: null },
      { visibility: { $nin: ["public", "private"] } },
    ],
  };

  const result = await Summary.updateMany(filter, { $set: { visibility: "private" } });

  console.log("Summary visibility migration done:");
  console.log("  matchedCount:", result.matchedCount);
  console.log("  modifiedCount:", result.modifiedCount);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
