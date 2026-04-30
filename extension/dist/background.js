import { API_BASE } from "./googleAuth.js";
import { deriveSummaryTitle, extractTitleAndSummary, sanitizeSummaryText, } from "./summaryderive.js";
const CAPTURE_WINDOW_STORAGE_KEY = "captureWindowId";
function detectPlatform(url) {
    try {
        const { hostname } = new URL(url);
        if (hostname.includes("chat.openai.com") || hostname.includes("chatgpt.com"))
            return "ChatGPT";
        if (hostname.includes("claude.ai"))
            return "Claude";
        if (hostname.includes("gemini.google.com"))
            return "Gemini";
        if (hostname.includes("bing.com") || hostname.includes("copilot.microsoft.com"))
            return "Bing";
        if (hostname.includes("grok.com") || hostname.includes("x.com"))
            return "Grok";
        return "Unknown";
    }
    catch {
        return "Unknown";
    }
}
async function getStoredCaptureWindowId() {
    return new Promise((resolve) => {
        chrome.storage.local.get([CAPTURE_WINDOW_STORAGE_KEY], (result) => {
            const raw = result?.[CAPTURE_WINDOW_STORAGE_KEY];
            resolve(typeof raw === "number" ? raw : null);
        });
    });
}
async function setStoredCaptureWindowId(id) {
    return new Promise((resolve) => {
        if (id === null) {
            chrome.storage.local.remove([CAPTURE_WINDOW_STORAGE_KEY], () => resolve());
            return;
        }
        chrome.storage.local.set({ [CAPTURE_WINDOW_STORAGE_KEY]: id }, () => resolve());
    });
}
async function focusWindowIfExists(id) {
    return new Promise((resolve) => {
        chrome.windows.get(id, {}, (win) => {
            const err = chrome.runtime.lastError;
            if (err || !win?.id) {
                resolve(false);
                return;
            }
            chrome.windows.update(win.id, { focused: true }, () => resolve(true));
        });
    });
}
async function openOrFocusQuickCaptureWindow() {
    const existingId = await getStoredCaptureWindowId();
    if (existingId !== null) {
        const focused = await focusWindowIfExists(existingId);
        if (focused)
            return;
        await setStoredCaptureWindowId(null);
    }
    const url = chrome.runtime.getURL("popup.html");
    await new Promise((resolve) => {
        chrome.windows.create({
            url,
            type: "popup",
            width: 360,
            height: 620,
            focused: true,
        }, async (win) => {
            const last = chrome.runtime.lastError;
            if (last || !win?.id) {
                resolve();
                return;
            }
            await setStoredCaptureWindowId(win.id);
            resolve();
        });
    });
}
function contentScriptFileForUrl(url) {
    try {
        const { hostname, protocol } = new URL(url);
        if (protocol !== "https:")
            return null;
        if (hostname === "chatgpt.com" || hostname === "chat.openai.com")
            return "dist/content-chatgpt.js";
        if (hostname === "claude.ai")
            return "dist/content-claude.js";
        if (hostname === "gemini.google.com")
            return "dist/content-gemini.js";
        if (hostname === "www.bing.com" || hostname === "copilot.microsoft.com")
            return "dist/content-chatgpt.js";
        if (hostname === "grok.com" || hostname === "x.com")
            return "dist/content-chatgpt.js";
        return null;
    }
    catch {
        return null;
    }
}
async function getStoredAuthToken() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["authToken"], (result) => {
            resolve(typeof result.authToken === "string" && result.authToken.length > 0 ? result.authToken : null);
        });
    });
}
async function readErrorMessage(res) {
    const text = await res.text();
    try {
        const parsed = JSON.parse(text);
        if (typeof parsed.error === "string" && parsed.error.length > 0)
            return parsed.error;
    }
    catch {
        // ignore json parsing issues
    }
    return text.trim() || `Request failed (${res.status})`;
}
async function sendTabMessage(tabId, payload) {
    if (typeof tabId !== "number")
        return;
    await new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, payload, () => {
            void chrome.runtime.lastError;
            resolve();
        });
    });
}
async function broadcastRuntimeMessage(payload) {
    await new Promise((resolve) => {
        chrome.runtime.sendMessage(payload, () => {
            // Popup/options listeners are often not open; ignore "Receiving end does not exist".
            void chrome.runtime.lastError;
            resolve();
        });
    });
}
async function saveSummaryDirectly(message) {
    const token = await getStoredAuthToken();
    if (!token) {
        return { ok: false, reason: "Please sign in to AI Remember first." };
    }
    const platform = String(message?.platform ?? "Unknown");
    const url = String(message?.url ?? "");
    const createdAt = String(message?.createdAt ?? new Date().toISOString());
    const sanitized = sanitizeSummaryText(String(message?.summaryText ?? ""));
    const extracted = extractTitleAndSummary(sanitized);
    const cleanedSummaryText = extracted.summaryText;
    const title = (extracted.title ?? "").trim() || deriveSummaryTitle(cleanedSummaryText);
    try {
        const res = await fetch(`${API_BASE}/api/summaries`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                platform,
                title,
                summaryText: cleanedSummaryText,
                url,
                createdAt,
            }),
        });
        if (!res.ok) {
            return { ok: false, reason: await readErrorMessage(res) };
        }
        return { ok: true };
    }
    catch {
        return { ok: false, reason: "Network error while saving capture." };
    }
}
async function ensureContentScriptForTab(tabId, url) {
    const file = contentScriptFileForUrl(url);
    if (!file)
        return;
    const hasScript = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { type: "PING_CAPTURE_READY" }, () => {
            const err = chrome.runtime.lastError;
            resolve(!err);
        });
    });
    if (hasScript)
        return;
    await new Promise((resolve) => {
        chrome.scripting.executeScript({ target: { tabId }, files: [file], world: "ISOLATED" }, () => {
            void chrome.runtime.lastError;
            resolve();
        });
    });
}
function injectIntoOpenSupportedTabs() {
    chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
            if (!tab.id || !tab.url)
                continue;
            void ensureContentScriptForTab(tab.id, tab.url);
        }
    });
}
function injectIntoActiveTab(windowId) {
    chrome.tabs.query({ active: true, ...(typeof windowId === "number" ? { windowId } : {}) }, (tabs) => {
        const active = tabs[0];
        if (!active?.id || !active.url)
            return;
        void ensureContentScriptForTab(active.id, active.url);
    });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_CONTEXT") {
        const tab = sender.tab;
        if (!tab || !tab.url) {
            sendResponse({ supported: false });
            return false;
        }
        const platform = detectPlatform(tab.url);
        sendResponse({
            supported: platform !== "Unknown",
            platform,
            url: tab.url,
        });
        return false;
    }
    if (message.type === "SUMMARY_COMPLETE") {
        const autoSave = Boolean(message?.autoSave);
        if (autoSave) {
            void (async () => {
                const result = await saveSummaryDirectly(message);
                if (result.ok) {
                    await sendTabMessage(sender.tab?.id, { type: "SHOW_CAPTURE_SAVED_INDICATOR" });
                    await broadcastRuntimeMessage({
                        type: "SUMMARIZE_STATUS",
                        status: "saved",
                    });
                }
                else {
                    await sendTabMessage(sender.tab?.id, {
                        type: "SHOW_CAPTURE_ERROR_INDICATOR",
                        reason: result.reason,
                    });
                    await broadcastRuntimeMessage({
                        type: "SUMMARIZE_STATUS",
                        status: "error",
                        reason: result.reason,
                    });
                }
                sendResponse({});
            })();
            return true;
        }
        const pending = {
            ...message,
            summaryText: sanitizeSummaryText(String(message?.summaryText ?? "")),
            sourceTabId: sender.tab?.id ?? null,
        };
        chrome.storage.local.set({ pendingSummary: pending }, () => {
            void (async () => {
                try {
                    await openOrFocusQuickCaptureWindow();
                }
                finally {
                    await broadcastRuntimeMessage({
                        type: "SUMMARIZE_STATUS",
                        status: "ready_to_review",
                    });
                    sendResponse({});
                }
            })();
        });
        return true;
    }
    /**
     * OAuth must not run in the service worker: the worker can suspend while the user
     * is on Google, so launchWebAuthFlow never completes. Open a small extension window instead.
     */
    if (message.type === "GOOGLE_AUTH_START") {
        const authPageUrl = chrome.runtime.getURL("auth-window.html");
        chrome.windows.create({
            url: authPageUrl,
            type: "popup",
            width: 420,
            height: 260,
            focused: true,
        }, () => {
            const last = chrome.runtime.lastError;
            if (last) {
                sendResponse({
                    ok: false,
                    error: last.message || "Could not open sign-in window.",
                });
                return;
            }
            sendResponse({ ok: true, opened: true });
        });
        return true;
    }
    return false;
});
chrome.runtime.onInstalled.addListener(() => {
    injectIntoOpenSupportedTabs();
});
chrome.runtime.onStartup.addListener(() => {
    injectIntoOpenSupportedTabs();
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url)
        return;
    void ensureContentScriptForTab(tabId, tab.url);
});
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError || !tab?.id || !tab.url)
            return;
        void ensureContentScriptForTab(tab.id, tab.url);
    });
});
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE)
        return;
    injectIntoActiveTab(windowId);
});
injectIntoOpenSupportedTabs();
//# sourceMappingURL=background.js.map