import "dotenv/config";
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:3000";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || "http://localhost:4000";

function createAppToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

function createExtensionState(redirectUri: string) {
  return jwt.sign({ typ: "ext_oauth_state", redirectUri }, JWT_SECRET, {
    expiresIn: "10m",
  });
}

function verifyExtensionState(state: string, redirectUri: string) {
  const payload = jwt.verify(state, JWT_SECRET) as {
    typ?: string;
    redirectUri?: string;
  };
  if (payload.typ !== "ext_oauth_state" || payload.redirectUri !== redirectUri) {
    throw new Error("Invalid oauth state");
  }
}

async function upsertUserFromGoogleIdToken(idToken: string) {
  const decoded: any = jwt.decode(idToken);
  if (!decoded || !decoded.sub || !decoded.email) {
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

router.get("/auth/google", (req, res) => {
  const target = (req.query.target as string) || "web";
  const redirectUri = `${SERVER_BASE_URL}/api/auth/google/callback`;

  if (!GOOGLE_CLIENT_ID) {
    return res
      .status(500)
      .send("Missing GOOGLE_CLIENT_ID. Check backend/.env and restart the backend.");
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state: target,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.redirect(url);
});

router.get("/auth/google/url", (req, res) => {
  const redirectUri = (req.query.redirect_uri as string) || "";

  if (!GOOGLE_CLIENT_ID) {
    return res
      .status(500)
      .json({ error: "Missing GOOGLE_CLIENT_ID. Check backend/.env and restart the backend." });
  }

  if (!redirectUri) {
    return res.status(400).json({ error: "Missing redirect_uri" });
  }

  const state = createExtensionState(redirectUri);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url });
});

router.post("/auth/google/exchange", async (req, res) => {
  const { code, redirect_uri: redirectUri, state } = req.body as {
    code?: string;
    redirect_uri?: string;
    state?: string;
  };

  if (!code || !redirectUri || !state) {
    return res.status(400).json({ error: "Missing code, redirect_uri, or state" });
  }

  try {
    verifyExtensionState(state, redirectUri);
  } catch (e) {
    return res.status(400).json({ error: "Invalid state" });
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = (await tokenRes.json()) as {
      id_token?: string;
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !tokenJson.id_token) {
      const details =
        tokenJson.error || tokenJson.error_description
          ? `Google token error: ${tokenJson.error || ""} ${tokenJson.error_description || ""}`.trim()
          : `Google token error: HTTP ${tokenRes.status}`;
      console.error(details, { hasClientId: !!GOOGLE_CLIENT_ID, hasClientSecret: !!GOOGLE_CLIENT_SECRET, redirectUri });
      return res.status(500).json({ error: `Failed to obtain id_token from Google. ${details}` });
    }

    const user = await upsertUserFromGoogleIdToken(tokenJson.id_token);
    const appToken = createAppToken(user.id);

    res.json({
      token: appToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Google OAuth exchange error" });
  }
});

router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string | undefined;
  const target = (req.query.state as string) || "web";

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  const redirectUri = `${SERVER_BASE_URL}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenJson = (await tokenRes.json()) as {
      id_token?: string;
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenRes.ok || !tokenJson.id_token) {
      const details =
        tokenJson.error || tokenJson.error_description
          ? `Google token error: ${tokenJson.error || ""} ${tokenJson.error_description || ""}`.trim()
          : `Google token error: HTTP ${tokenRes.status}`;
      console.error(details, { hasClientId: !!GOOGLE_CLIENT_ID, hasClientSecret: !!GOOGLE_CLIENT_SECRET, redirectUri });
      return res.status(500).send(`Failed to obtain id_token from Google. ${details}`);
    }

    const user = await upsertUserFromGoogleIdToken(tokenJson.id_token);

    const appToken = createAppToken(user.id);

    res.cookie("auth_token", appToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    if (target === "extension") {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Login Successful - Notionix</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FCFCFD; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; color: #1E293B; }
            .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #F1F5F9; text-align: center; max-width: 400px; }
            .icon { width: 48px; height: 48px; background: #EEF2FF; color: #4B5CC4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
            h1 { margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #0F172A; }
            p { margin: 0; color: #64748B; line-height: 1.5; font-size: 15px; }
          </style>
          <script>
            // Attempt to send a message back to the extension
            if (window.opener) {
              window.opener.postMessage({ type: 'NOTIONIX_AUTH_SUCCESS' }, '*');
            }
            // Auto close after 3 seconds
            setTimeout(function() { window.close(); }, 3000);
          </script>
        </head>
        <body>
          <div class="card">
            <div class="icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h1>Authentication Successful</h1>
            <p>You have successfully securely connected your account. You can safely close this window.</p>
          </div>
        </body>
        </html>
      `);
    } else {
      res.redirect(`${CLIENT_BASE_URL}/dashboard`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Google OAuth error");
  }
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.status(204).send();
});

router.get("/auth/token", async (req, res) => {
  const token = (req.cookies as any)?.auth_token as string | undefined;
  if (!token) {
    return res.status(401).json({ error: "No auth token cookie found" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({ 
      token, 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

