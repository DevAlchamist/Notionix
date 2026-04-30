import mongoose from "mongoose";

const MONGOOSE_URI = process.env.MONGO_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
if (process.env.NODE_ENV !== "production") {
  global.mongooseCache = cache;
}

export async function connectMongoose(): Promise<typeof mongoose> {
  if (!MONGOOSE_URI?.trim()) {
    throw new Error("MONGO_URI is not set");
  }
  if (cache.conn) {
    return cache.conn;
  }
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGOOSE_URI, {
      bufferCommands: false,
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
