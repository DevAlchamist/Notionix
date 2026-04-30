/** Next.js app origin (API under /api). Must match Google OAuth authorized origins / redirect URIs. */
export declare const API_BASE = "http://localhost:3000";
export type AuthUser = {
    id: string;
    email: string;
    name: string;
    avatar?: string;
} | null;
/**
 * Extension OAuth:
 * 1) GET /api/auth/google/url?redirect_uri=<chrome.identity redirect> — Google authorize URL + signed state
 * 2) chrome.identity.launchWebAuthFlow — Google redirects to extension URL with ?code&state
 * 3) POST /api/auth/google/exchange — exchange code for app JWT + user
 */
export declare function runExtensionGoogleOAuth(): Promise<{
    token: string;
    user: AuthUser;
}>;
//# sourceMappingURL=googleAuth.d.ts.map