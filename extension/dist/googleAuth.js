/** Next.js app origin (API under /api). Must match Google OAuth authorized origins / redirect URIs. */
export const API_BASE = "http://localhost:3000";
function parseQueryParams(url) {
    const u = new URL(url);
    const params = u.searchParams;
    return {
        code: params.get("code"),
        state: params.get("state"),
        error: params.get("error"),
        errorDescription: params.get("error_description"),
    };
}
async function readErrorMessage(res) {
    const text = await res.text();
    try {
        const j = JSON.parse(text);
        if (j.error && typeof j.error === "string")
            return j.error;
    }
    catch {
        /* not JSON */
    }
    const trimmed = text.trim();
    return trimmed ? trimmed.slice(0, 280) : `Request failed (${res.status})`;
}
/**
 * Extension OAuth:
 * 1) GET /api/auth/google/url?redirect_uri=<chrome.identity redirect> — Google authorize URL + signed state
 * 2) chrome.identity.launchWebAuthFlow — Google redirects to extension URL with ?code&state
 * 3) POST /api/auth/google/exchange — exchange code for app JWT + user
 */
export async function runExtensionGoogleOAuth() {
    const redirectUri = chrome.identity.getRedirectURL("oauth2");
    const urlRes = await fetch(`${API_BASE}/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
    if (!urlRes.ok) {
        throw new Error(await readErrorMessage(urlRes));
    }
    const urlBody = (await urlRes.json());
    if (urlBody.error) {
        throw new Error(urlBody.error);
    }
    if (!urlBody.url || typeof urlBody.url !== "string") {
        throw new Error("Server did not return a Google sign-in URL. Is the Next.js app running?");
    }
    const googleAuthUrl = urlBody.url;
    const finalUrl = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({ url: googleAuthUrl, interactive: true }, (redirectedTo) => {
            const last = chrome.runtime.lastError;
            if (last) {
                reject(new Error(last.message || "Google sign-in could not start."));
                return;
            }
            if (!redirectedTo) {
                reject(new Error("Sign-in was cancelled or no redirect was received."));
                return;
            }
            resolve(redirectedTo);
        });
    });
    const { code, state, error, errorDescription } = parseQueryParams(finalUrl);
    if (error) {
        let detail = error;
        if (errorDescription) {
            try {
                detail = decodeURIComponent(errorDescription.replace(/\+/g, " "));
            }
            catch {
                detail = errorDescription;
            }
        }
        throw new Error(detail || error);
    }
    if (!code || !state) {
        throw new Error("Missing authorization code from Google. In Google Cloud Console, add this redirect URI for your OAuth client: " +
            redirectUri);
    }
    const exchangeRes = await fetch(`${API_BASE}/api/auth/google/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
            state,
        }),
    });
    if (!exchangeRes.ok) {
        throw new Error(await readErrorMessage(exchangeRes));
    }
    const data = (await exchangeRes.json());
    if (!data.token) {
        throw new Error("Server did not return a session token.");
    }
    return { token: data.token, user: data.user ?? null };
}
//# sourceMappingURL=googleAuth.js.map