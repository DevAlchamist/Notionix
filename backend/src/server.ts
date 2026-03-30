import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/auth";
import summaryRoutes from "./routes/summaries";
import tagRoutes from "./routes/tags";
import workspaceRoutes from "./routes/workspaces";
import socialRoutes from "./routes/social";
import notificationRoutes from "./routes/notifications";
import { User } from "./models/User";

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://nayakshubhanshu69_db_user:5SJBKFMw3ySdyUmv@cluster0.s9ztfqq.mongodb.net/?appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:3000";

function assertEnvLoaded() {
  const required = [
    "MONGO_URI",
    "JWT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "SERVER_BASE_URL",
    "CLIENT_BASE_URL",
  ] as const;

  const missing = required.filter((k) => !process.env[k] || process.env[k]?.trim() === "");
  if (missing.length) {
    console.error(
      `❌ .env not loaded properly (missing: ${missing.join(", ")}). ` +
        `Make sure you're running from the backend folder and the file is at backend/.env`,
    );
    process.exit(1);
  }
  console.log("✅ .env loaded (required keys present)");
}

assertEnvLoaded();

async function connectMongo() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
}

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin (curl, server-to-server)
      if (!origin) return callback(null, true);

      const allowed = new Set([CLIENT_BASE_URL, "http://localhost:3000"]);
      if (allowed.has(origin)) return callback(null, true);

      // Chrome extension popup/background fetches come from chrome-extension://<id>
      if (origin.startsWith("chrome-extension://")) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use(async (req, _res, next) => {
  const cookieToken = (req.cookies as any)?.auth_token as string | undefined;
  const authHeader = req.header("authorization") || req.header("Authorization");
  const bearerToken =
    authHeader && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice("bearer ".length).trim()
      : undefined;

  const token = bearerToken || cookieToken;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    (req as any).userId = payload.sub;
  } catch {
    // ignore invalid token
  }

  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = await User.findById(userId).lean();
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  });
});

app.use("/api", authRoutes);
app.use("/api", summaryRoutes);
app.use("/api", tagRoutes);
app.use("/api", workspaceRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/notifications", notificationRoutes);

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

