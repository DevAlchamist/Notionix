import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { JWT_SECRET } from "./request";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
export const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:3000";
export const SERVER_BASE_URL = process.env.SERVER_BASE_URL || "http://localhost:3000";

export function createAppToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function createExtensionState(redirectUri: string) {
  return jwt.sign({ typ: "ext_oauth_state", redirectUri }, JWT_SECRET, {
    expiresIn: "10m",
  });
}

export function verifyExtensionState(state: string, redirectUri: string) {
  const payload = jwt.verify(state, JWT_SECRET) as {
    typ?: string;
    redirectUri?: string;
  };
  if (payload.typ !== "ext_oauth_state" || payload.redirectUri !== redirectUri) {
    throw new Error("Invalid oauth state");
  }
}

export async function upsertUserFromGoogleIdToken(idToken: string) {
  const decoded: jwt.JwtPayload | string | null = jwt.decode(idToken);
  if (!decoded || typeof decoded !== "object" || !decoded.sub || !decoded.email) {
    throw new Error("Invalid id_token payload");
  }

  const googleId = decoded.sub as string;
  const email = decoded.email as string;
  const name = (decoded.name as string) || email;
  const avatar = decoded.picture as string | undefined;

  let user = await User.findOne({ googleId });
  if (!user) {
    const createPayload: {
      googleId: string;
      email: string;
      name: string;
      avatar?: string;
    } = { googleId, email, name };
    if (avatar) {
      createPayload.avatar = avatar;
    }
    user = await User.create(createPayload);
  } else {
    user.email = email;
    user.name = name;
    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    await user.save();
  }

  return user;
}

export function authCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  };
}
