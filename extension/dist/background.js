import { sanitizeSummaryText } from "./summaryderive.js";
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
        const pending = {
            ...message,
            summaryText: sanitizeSummaryText(String(message?.summaryText ?? "")),
        };
        chrome.storage.local.set({ pendingSummary: pending }, () => {
            void (async () => {
                try {
                    await openOrFocusQuickCaptureWindow();
                }
                finally {
                    chrome.runtime.sendMessage({
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
//# sourceMappingURL=background.js.map