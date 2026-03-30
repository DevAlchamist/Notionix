/** Must match backend URL and Google OAuth client authorized redirect URIs. */
export declare const API_BASE = "http://localhost:4000";
export type AuthUser = {
    id: string;
    email: string;
    name: string;
    avatar?: string;
} | null;
/**
 * Extension OAuth path (backend design):
 * 1) GET /api/auth/google/url?redirect_uri=<chrome.identity redirect> — returns Google authorize URL + signed state
 * 2) chrome.identity.launchWebAuthFlow — user signs in; Google redirects to extension URL with ?code&state
 * 3) POST /api/auth/google/exchange — backend swaps code for tokens, upserts user, returns app JWT
 */
export declare function runExtensionGoogleOAuth(): Promise<{
    token: string;
    user: AuthUser;
}>;
//# sourceMappingURL=googleAuth.d.ts.map