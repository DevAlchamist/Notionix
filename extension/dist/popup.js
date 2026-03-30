import { API_BASE } from "./googleAuth.js";
import { deriveSummaryTitle, extractTitleAndSummary } from "./summaryderive.js";
let allRecentSummaries = [];
let currentSummarySearch = "";
function setStatus(text) {
    const signedInStatus = document.getElementById("status-text");
    const loginStatus = document.getElementById("login-status");
    if (document.body.dataset.auth === "in") {
        if (signedInStatus)
            signedInStatus.textContent = text;
        if (loginStatus)
            loginStatus.textContent = "";
    }
    else {
        if (loginStatus)
            loginStatus.textContent = text;
        if (signedInStatus)
            signedInStatus.textContent = "";
    }
}
function renderSummaries(list) {
    const container = document.getElementById("recent-summaries");
    if (!container)
        return;
    container.innerHTML = "";
    if (list.length === 0) {
        container.textContent = "No summaries yet.";
        return;
    }
    for (const item of list) {
        const div = document.createElement("div");
        div.className = "summary-item";
        const title = document.createElement("div");
        title.className = "summary-title";
        title.textContent = item.title || "(Untitled)";
        const meta = document.createElement("div");
        meta.className = "summary-meta";
        const date = new Date(item.createdAt).toLocaleString();
        meta.textContent = `${date}`;
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = item.platform;
        meta.appendChild(badge);
        div.appendChild(title);
        div.appendChild(meta);
        container.appendChild(div);
    }
}
function applySummarySearch() {
    const query = currentSummarySearch.trim().toLowerCase();
    if (!query) {
        renderSummaries(allRecentSummaries);
        return;
    }
    const filtered = allRecentSummaries.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const platform = (item.platform || "").toLowerCase();
        return title.includes(query) || platform.includes(query);
    });
    renderSummaries(filtered);
}
let currentPendingSummary = null;
const PERSONAL_WORKSPACE_LABEL = "Personal workspace";
let qcWorkspaceRows = [];
let qcSelectedWorkspaceId = "";
function qcSyncTriggerLabel() {
    const label = document.getElementById("qc-workspace-label");
    if (!label)
        return;
    if (!qcSelectedWorkspaceId) {
        label.textContent = PERSONAL_WORKSPACE_LABEL;
        return;
    }
    const row = qcWorkspaceRows.find((r) => r.id === qcSelectedWorkspaceId);
    label.textContent = row?.name ?? PERSONAL_WORKSPACE_LABEL;
}
function qcSetSelectedWorkspaceId(id) {
    qcSelectedWorkspaceId = id;
    qcSyncTriggerLabel();
}
function qcCloseWorkspaceMenu() {
    const list = document.getElementById("qc-workspace-list");
    const trigger = document.getElementById("qc-workspace-trigger");
    if (list)
        list.hidden = true;
    if (trigger)
        trigger.setAttribute("aria-expanded", "false");
}
function qcToggleWorkspaceMenu() {
    const list = document.getElementById("qc-workspace-list");
    const trigger = document.getElementById("qc-workspace-trigger");
    if (!list || !trigger)
        return;
    const nextOpen = list.hidden;
    list.hidden = !nextOpen;
    trigger.setAttribute("aria-expanded", nextOpen ? "true" : "false");
}
function qcRenderWorkspaceOptions(items) {
    qcWorkspaceRows = items;
    const ul = document.getElementById("qc-workspace-list");
    if (!ul)
        return;
    ul.innerHTML = "";
    const personal = document.createElement("li");
    personal.setAttribute("role", "option");
    personal.dataset.value = "";
    personal.className = "qc-workspace-option";
    personal.textContent = PERSONAL_WORKSPACE_LABEL;
    ul.appendChild(personal);
    for (const w of items) {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        li.dataset.value = w.id;
        li.className = "qc-workspace-option";
        li.textContent = w.name;
        ul.appendChild(li);
    }
}
async function checkPendingSummary() {
    return new Promise((resolve) => {
        chrome.storage.local.get("pendingSummary", (result) => {
            resolve(result.pendingSummary || null);
        });
    });
}
async function showQuickCaptureView(summaryData) {
    document.body.dataset.capture = "active";
    const textEl = document.getElementById("qc-summary-text");
    const generatedTitleEl = document.getElementById("qc-generated-title");
    const titleEl = document.getElementById("qc-source-title");
    const urlEl = document.getElementById("qc-source-url");
    const extracted = extractTitleAndSummary(String(summaryData.summaryText ?? ""));
    const cleanedSummaryText = extracted.summaryText;
    const resolvedTitle = (extracted.title ?? "").trim() || deriveSummaryTitle(cleanedSummaryText);
    if (generatedTitleEl)
        generatedTitleEl.textContent = resolvedTitle;
    if (textEl)
        textEl.textContent = cleanedSummaryText || "";
    if (titleEl)
        titleEl.textContent = resolvedTitle;
    if (urlEl) {
        try {
            const u = new URL(summaryData.url);
            urlEl.textContent = u.hostname.toUpperCase();
        }
        catch {
            urlEl.textContent = "UNKNOWN SOURCE";
        }
    }
    qcSetSelectedWorkspaceId("");
    qcCloseWorkspaceMenu();
}
function hideQuickCaptureView() {
    document.body.dataset.capture = "inactive";
    currentPendingSummary = null;
    chrome.storage.local.remove("pendingSummary");
    const saveBtn = document.getElementById("qc-save-btn");
    if (saveBtn)
        saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Memory`;
    const tagsInput = document.getElementById("qc-tags-input");
    if (tagsInput)
        tagsInput.value = "";
    qcSetSelectedWorkspaceId("");
    qcCloseWorkspaceMenu();
}
async function fetchWorkspaces(token) {
    try {
        const res = await fetch(`${API_BASE}/api/workspaces`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const items = (data.items || []).map((w) => ({
                id: String(w.id ?? ""),
                name: String(w.name ?? "Untitled"),
            }));
            qcRenderWorkspaceOptions(items.filter((x) => x.id.length > 0));
        }
    }
    catch (e) {
        console.error("Failed to load workspaces", e);
    }
}
async function saveSummary(summaryData, token) {
    const saveBtn = document.getElementById("qc-save-btn");
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    const tagsInput = document.getElementById("qc-tags-input");
    const workspaceId = qcSelectedWorkspaceId || undefined;
    const tagsString = tagsInput?.value || "";
    const tagsTextArray = tagsString.split(",").map(t => t.trim()).filter(t => t.length > 0);
    let finalTagIds = [];
    for (const t of tagsTextArray) {
        try {
            const tRes = await fetch(`${API_BASE}/api/tags`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: t })
            });
            if (tRes.ok) {
                const tData = await tRes.json();
                finalTagIds.push(tData.id);
            }
            else if (tRes.status === 400) {
                const allTagsRes = await fetch(`${API_BASE}/api/tags`, { headers: { Authorization: `Bearer ${token}` } });
                if (allTagsRes.ok) {
                    const allData = await allTagsRes.json();
                    const existing = allData.items.find((item) => item.name === t);
                    if (existing)
                        finalTagIds.push(existing.id);
                }
            }
        }
        catch { }
    }
    const { platform, summaryText, url, createdAt } = summaryData;
    const extracted = extractTitleAndSummary(String(summaryText ?? ""));
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
                workspaceId,
                tags: finalTagIds
            }),
        });
        saveBtn.disabled = false;
        if (res.ok) {
            hideQuickCaptureView();
            setStatus("Summary saved.");
            fetchRecentSummaries(token);
        }
        else {
            setStatus("Failed to save summary.");
            saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Memory`;
        }
    }
    catch (err) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Memory`;
        setStatus("Network error while saving.");
    }
}
async function fetchRecentSummaries(token) {
    if (!token) {
        allRecentSummaries = [];
        renderSummaries([]);
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/summaries?limit=50`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) {
            throw new Error("Failed to load summaries");
        }
        const data = await res.json();
        allRecentSummaries = (data.items ?? []);
        applySummarySearch();
    }
    catch (err) {
        setStatus("Unable to load summaries.");
    }
}
function isSupportedConversationUrl(url) {
    try {
        const { hostname, protocol } = new URL(url);
        if (protocol !== "https:")
            return false;
        return (hostname === "chatgpt.com" ||
            hostname === "chat.openai.com" ||
            hostname === "claude.ai" ||
            hostname === "gemini.google.com");
    }
    catch {
        return false;
    }
}
function contentScriptFileForUrl(url) {
    try {
        const { hostname } = new URL(url);
        if (hostname === "chatgpt.com" || hostname === "chat.openai.com")
            return "dist/content-chatgpt.js";
        if (hostname === "claude.ai")
            return "dist/content-claude.js";
        if (hostname === "gemini.google.com")
            return "dist/content-gemini.js";
        return null;
    }
    catch {
        return null;
    }
}
async function getStoredAuth() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["authToken", "user"], (result) => {
            resolve({ token: result.authToken ?? null, user: result.user ?? null });
        });
    });
}
async function setStoredAuth(token, user) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ authToken: token, user }, () => resolve());
    });
}
async function clearStoredAuth() {
    return new Promise((resolve) => {
        chrome.storage.sync.remove(["authToken", "user"], () => resolve());
    });
}
async function fetchMe(token) {
    const res = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok)
        throw new Error("Unauthorized");
    return (await res.json());
}
function applyAuthTheme(isAuthed) {
    document.body.dataset.auth = isAuthed ? "in" : "out";
}
function renderUser(user) {
    const avatarEl = document.getElementById("user-avatar");
    const nameEl = document.getElementById("user-name");
    const emailEl = document.getElementById("user-email");
    const signedOutEl = document.getElementById("signed-out");
    const signedInEl = document.getElementById("signed-in");
    if (user) {
        if (avatarEl) {
            avatarEl.src = user.avatar || "";
            avatarEl.alt = user.name || user.email || "User";
            avatarEl.style.display = user.avatar ? "block" : "none";
        }
        if (nameEl)
            nameEl.textContent = user.name || "Signed in";
        if (emailEl)
            emailEl.textContent = user.email || "";
        if (signedOutEl)
            signedOutEl.style.display = "none";
        if (signedInEl)
            signedInEl.style.display = "flex";
        applyAuthTheme(true);
    }
    else {
        if (avatarEl)
            avatarEl.style.display = "none";
        if (nameEl)
            nameEl.textContent = "";
        if (emailEl)
            emailEl.textContent = "";
        if (signedOutEl)
            signedOutEl.style.display = "flex";
        if (signedInEl)
            signedInEl.style.display = "none";
        applyAuthTheme(false);
    }
}
async function init() {
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const summarizeBtn = document.getElementById("summarize-btn");
    let { token: authToken, user: cachedUser } = await getStoredAuth();
    function updateAuthUI() {
        summarizeBtn.disabled = !authToken;
    }
    updateAuthUI();
    if (authToken) {
        try {
            const me = await fetchMe(authToken);
            cachedUser = me;
            await setStoredAuth(authToken, me);
            renderUser(me);
            fetchWorkspaces(authToken);
            const pending = await checkPendingSummary();
            if (pending) {
                currentPendingSummary = pending;
                showQuickCaptureView(pending);
            }
            setStatus(`Signed in as ${me.name || me.email}`);
        }
        catch {
            authToken = null;
            cachedUser = null;
            await clearStoredAuth();
            renderUser(null);
            setStatus("Please sign in.");
        }
    }
    else {
        renderUser(null);
        setStatus("Please sign in.");
    }
    try {
        await fetchRecentSummaries(authToken);
    }
    catch (err) {
        // If backend is down/unreachable, we still want the popup to stay usable.
        console.warn("Failed to fetch recent summaries", err);
    }
    const searchInput = document.getElementById("memories-search-input");
    searchInput?.addEventListener("input", () => {
        currentSummarySearch = searchInput.value || "";
        applySummarySearch();
    });
    loginBtn.addEventListener("click", () => {
        loginBtn.disabled = true;
        setStatus("Starting sign-in…");
        chrome.runtime.sendMessage({ type: "GOOGLE_AUTH_START" }, (response) => {
            loginBtn.disabled = false;
            const last = chrome.runtime.lastError;
            if (last) {
                setStatus(last.message || "Could not reach the extension background.");
                return;
            }
            const r = response;
            if (!r || !r.ok) {
                const errMsg = r && "error" in r && typeof r.error === "string" ? r.error : "Could not start sign-in.";
                setStatus(errMsg.length > 220 ? `${errMsg.slice(0, 220)}…` : errMsg);
                return;
            }
            setStatus("Finish signing in in the small Notionix window, then come back here.");
        });
    });
    logoutBtn.addEventListener("click", async () => {
        authToken = null;
        cachedUser = null;
        await clearStoredAuth();
        qcRenderWorkspaceOptions([]);
        qcSetSelectedWorkspaceId("");
        renderUser(null);
        updateAuthUI();
        allRecentSummaries = [];
        currentSummarySearch = "";
        const searchInputEl = document.getElementById("memories-search-input");
        if (searchInputEl)
            searchInputEl.value = "";
        renderSummaries([]);
        hideQuickCaptureView();
        setStatus("Signed out.");
    });
    document.getElementById("qc-save-btn")?.addEventListener("click", () => {
        if (currentPendingSummary && authToken) {
            saveSummary(currentPendingSummary, authToken);
        }
    });
    document.getElementById("qc-discard-btn")?.addEventListener("click", () => {
        hideQuickCaptureView();
        setStatus("Capture discarded.");
    });
    document.getElementById("qc-workspace-trigger")?.addEventListener("click", (e) => {
        e.stopPropagation();
        qcToggleWorkspaceMenu();
    });
    document.getElementById("qc-workspace-list")?.addEventListener("click", (e) => {
        e.stopPropagation();
        const li = e.target.closest("li.qc-workspace-option");
        if (!li)
            return;
        qcSetSelectedWorkspaceId(li.dataset.value ?? "");
        qcCloseWorkspaceMenu();
    });
    document.addEventListener("click", () => {
        qcCloseWorkspaceMenu();
    });
    summarizeBtn.addEventListener("click", () => {
        if (!authToken) {
            setStatus("Please sign in first.");
            return;
        }
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tabUrl = tabs[0]?.url;
            if (!tabUrl) {
                setStatus("No active tab URL.");
                return;
            }
            if (!isSupportedConversationUrl(tabUrl)) {
                setStatus("Open ChatGPT/Claude/Gemini to summarize.");
                return;
            }
            const tabId = tabs[0]?.id;
            if (!tabId) {
                setStatus("No active tab.");
                return;
            }
            const token = authToken;
            if (!token) {
                setStatus("Please sign in first.");
                return;
            }
            const trySend = () => {
                chrome.tabs.sendMessage(tabId, { type: "INJECT_SUMMARY_PROMPT" }, () => {
                    const err = chrome.runtime.lastError;
                    if (err) {
                        setStatus(`Unable to reach page script: ${err.message}`);
                        return;
                    }
                    setStatus("Asking AI to generate summary...");
                });
            };
            chrome.tabs.sendMessage(tabId, { type: "INJECT_SUMMARY_PROMPT" }, () => {
                const err = chrome.runtime.lastError;
                if (!err) {
                    setStatus("Asking AI to generate summary...");
                    return;
                }
                const file = contentScriptFileForUrl(tabUrl);
                if (!file) {
                    setStatus(`Unsupported tab: ${tabUrl}`);
                    return;
                }
                chrome.scripting.executeScript({ target: { tabId }, files: [file], world: "ISOLATED" }, () => {
                    const injErr = chrome.runtime.lastError;
                    if (injErr) {
                        setStatus(`Cannot inject into this tab: ${injErr.message}`);
                        return;
                    }
                    trySend();
                });
            });
        });
    });
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync" || !changes.authToken)
            return;
        const next = changes.authToken.newValue;
        if (next === undefined || next === null) {
            authToken = null;
            cachedUser = null;
            qcRenderWorkspaceOptions([]);
            qcSetSelectedWorkspaceId("");
            renderUser(null);
            updateAuthUI();
            allRecentSummaries = [];
            currentSummarySearch = "";
            const searchInputEl = document.getElementById("memories-search-input");
            if (searchInputEl)
                searchInputEl.value = "";
            renderSummaries([]);
            setStatus("Signed out.");
            return;
        }
        if (typeof next !== "string" || !next.length)
            return;
        void (async () => {
            try {
                const me = await fetchMe(next);
                authToken = next;
                cachedUser = me;
                await setStoredAuth(next, me);
                renderUser(me);
                updateAuthUI();
                setStatus(`Signed in as ${me.name || me.email}`);
                void fetchWorkspaces(next);
                fetchRecentSummaries(next).catch((err) => {
                    console.warn("Failed to fetch recent summaries after login", err);
                });
            }
            catch {
                setStatus("Signed in, but could not refresh profile. Try reopening the popup.");
            }
        })();
    });
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "SUMMARIZE_STATUS") {
            if (message.status === "waiting_ai") {
                setStatus("Waiting for AI to respond...");
            }
            else if (message.status === "ready_to_review") {
                checkPendingSummary().then(pending => {
                    if (pending && authToken) {
                        currentPendingSummary = pending;
                        showQuickCaptureView(pending);
                    }
                });
            }
            else if (message.status === "saved") {
                setStatus("Summary saved.");
                if (authToken) {
                    fetchRecentSummaries(authToken);
                }
            }
            else if (message.status === "error") {
                setStatus(message.reason ?? "Unable to summarize.");
            }
        }
    });
}
document.addEventListener("DOMContentLoaded", () => {
    init().catch((err) => {
        console.error(err);
        setStatus("Failed to initialize popup.");
    });
});
//# sourceMappingURL=popup.js.map