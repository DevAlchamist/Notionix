import { API_BASE, type AuthUser } from "./googleAuth.js";
import { deriveSummaryTitle, extractTitleAndSummary } from "./summaryderive.js";

type Platform = "ChatGPT" | "Claude" | "Gemini" | "Bing" | "Grok" | "Unknown";

type SummaryItem = {
  id: string;
  title: string;
  platform: Platform;
  createdAt: string;
};

type TagSuggestion = { id: string; name: string; count?: number };

let allRecentSummaries: SummaryItem[] = [];
let currentSummarySearch = "";

let qcTagSuggestTimer: number | null = null;
let qcTagSuggestAbort: AbortController | null = null;
let qcTagSuggestItems: TagSuggestion[] = [];
let qcTagSuggestActiveIndex = -1;

let insertSummaryHandler: ((summaryId: string) => void) | null = null;

function setStatus(text: string) {
  const signedInStatus = document.getElementById("status-text");
  const loginStatus = document.getElementById("login-status");
  if (document.body.dataset.auth === "in") {
    if (signedInStatus) signedInStatus.textContent = text;
    if (loginStatus) loginStatus.textContent = "";
  } else {
    if (loginStatus) loginStatus.textContent = text;
    if (signedInStatus) signedInStatus.textContent = "";
  }
}

function renderSummaries(list: SummaryItem[]) {
  const container = document.getElementById("recent-summaries");
  if (!container) return;
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
    const dateEl = document.createElement("span");
    dateEl.textContent = new Date(item.createdAt).toLocaleString();

    const insertBtn = document.createElement("button");
    insertBtn.type = "button";
    insertBtn.className = "summary-insert-btn";
    insertBtn.title = "Insert into current AI chat";
    insertBtn.setAttribute("aria-label", "Insert into current AI chat");
    insertBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      void insertSummaryHandler?.(item.id);
    });
    insertBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14"/>
        <path d="M5 12h14"/>
      </svg>
    `;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = item.platform;
    // Note: `.summary-meta` uses `flex-direction: row-reverse`, so append order is important.
    meta.appendChild(insertBtn);
    meta.appendChild(dateEl);
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

let currentPendingSummary: any = null;

const PERSONAL_WORKSPACE_LABEL = "Personal workspace";

let qcWorkspaceRows: { id: string; name: string }[] = [];
let qcSelectedWorkspaceId = "";

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function pickId(value: unknown): string {
  const obj = asObject(value);
  const id = obj.id ?? obj._id;
  return typeof id === "string" ? id : "";
}

function normalizeTagName(raw: string): string {
  return String(raw ?? "")
    .replace(/^#/, "")
    .trim()
    .replace(/\s+/g, " ");
}

function qcGetTagsInputEl(): HTMLInputElement | null {
  return document.getElementById("qc-tags-input") as HTMLInputElement | null;
}

function qcGetSuggestEl(): HTMLElement | null {
  return document.getElementById("qc-tags-suggest");
}

function qcParseCommaTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => normalizeTagName(t))
    .filter((t) => t.length > 0);
}

function qcActiveSegment(value: string): { prefix: string; query: string } {
  const idx = value.lastIndexOf(",");
  if (idx === -1) return { prefix: "", query: normalizeTagName(value) };
  const prefix = value.slice(0, idx + 1); // include comma
  const query = normalizeTagName(value.slice(idx + 1));
  return { prefix, query };
}

function qcHideTagSuggest() {
  const el = qcGetSuggestEl();
  if (!el) return;
  el.hidden = true;
  el.innerHTML = "";
  qcTagSuggestItems = [];
  qcTagSuggestActiveIndex = -1;
}

function qcRenderTagSuggest() {
  const el = qcGetSuggestEl();
  if (!el) return;

  el.innerHTML = "";
  if (!qcTagSuggestItems.length) {
    el.hidden = true;
    return;
  }

  for (let i = 0; i < qcTagSuggestItems.length; i++) {
    const item = qcTagSuggestItems[i];
    if (!item) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qc-tags-suggest-item";
    btn.setAttribute("role", "option");
    btn.dataset.id = item.id;
    btn.dataset.name = item.name;
    btn.dataset.index = String(i);
    if (i === qcTagSuggestActiveIndex) btn.dataset.active = "true";

    const name = document.createElement("span");
    name.className = "qc-tags-suggest-name";
    name.textContent = `#${item.name}`;

    const meta = document.createElement("span");
    meta.className = "qc-tags-suggest-meta";
    meta.textContent = typeof item.count === "number" ? `Used ${item.count}` : "";

    btn.appendChild(name);
    btn.appendChild(meta);

    btn.addEventListener("mousedown", (e) => {
      // prevent input blur before click handler runs
      e.preventDefault();
    });
    btn.addEventListener("click", () => {
      qcApplyTagSuggestion(item.name);
    });

    el.appendChild(btn);
  }

  el.hidden = false;
}

function qcApplyTagSuggestion(name: string) {
  const input = qcGetTagsInputEl();
  if (!input) return;

  const { prefix } = qcActiveSegment(input.value || "");
  const normalized = normalizeTagName(name);
  const beforePrefix = prefix;
  const existing = qcParseCommaTags(beforePrefix);
  const already = existing.some((t) => t.toLowerCase() === normalized.toLowerCase());

  const nextPrefix = beforePrefix.trimEnd();
  const glue =
    nextPrefix.length === 0 ? "" : nextPrefix.endsWith(",") ? `${nextPrefix} ` : `${nextPrefix}, `;

  input.value = already ? `${nextPrefix} ` : `${glue}${normalized}, `;
  qcHideTagSuggest();
  input.focus();
}

async function qcFetchTagSuggest(token: string, query: string) {
  if (qcTagSuggestTimer) {
    window.clearTimeout(qcTagSuggestTimer);
    qcTagSuggestTimer = null;
  }
  if (qcTagSuggestAbort) {
    qcTagSuggestAbort.abort();
    qcTagSuggestAbort = null;
  }

  qcTagSuggestTimer = window.setTimeout(async () => {
    try {
      const controller = new AbortController();
      qcTagSuggestAbort = controller;

      const res = await fetch(
        `${API_BASE}/api/tags/suggest?query=${encodeURIComponent(query)}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal },
      );
      if (!res.ok) throw new Error("suggest failed");
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      qcTagSuggestItems = items
        .map((it: any) => ({
          id: pickId(it),
          name: normalizeTagName(it?.name ?? ""),
          count: typeof it?.count === "number" ? it.count : undefined,
        }))
        .filter((it: TagSuggestion) => it.id && it.name);
      qcTagSuggestActiveIndex = qcTagSuggestItems.length ? 0 : -1;
      qcRenderTagSuggest();
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      qcHideTagSuggest();
    } finally {
      qcTagSuggestAbort = null;
    }
  }, 250);
}

function qcSyncTriggerLabel() {
  const label = document.getElementById("qc-workspace-label");
  if (!label) return;
  if (!qcSelectedWorkspaceId) {
    label.textContent = PERSONAL_WORKSPACE_LABEL;
    return;
  }
  const row = qcWorkspaceRows.find((r) => r.id === qcSelectedWorkspaceId);
  label.textContent = row?.name ?? PERSONAL_WORKSPACE_LABEL;
}

function qcSetSelectedWorkspaceId(id: string) {
  qcSelectedWorkspaceId = id;
  qcSyncTriggerLabel();
}

function qcCloseWorkspaceMenu() {
  const list = document.getElementById("qc-workspace-list");
  const trigger = document.getElementById("qc-workspace-trigger");
  if (list) list.hidden = true;
  if (trigger) trigger.setAttribute("aria-expanded", "false");
}

function qcToggleWorkspaceMenu() {
  const list = document.getElementById("qc-workspace-list");
  const trigger = document.getElementById("qc-workspace-trigger");
  if (!list || !trigger) return;
  const nextOpen = list.hidden;
  list.hidden = !nextOpen;
  trigger.setAttribute("aria-expanded", nextOpen ? "true" : "false");
}

function qcRenderWorkspaceOptions(items: { id: string; name: string }[]) {
  qcWorkspaceRows = items;
  const ul = document.getElementById("qc-workspace-list");
  if (!ul) return;
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
  return new Promise<any>((resolve) => {
    chrome.storage.local.get("pendingSummary", (result) => {
      resolve(result.pendingSummary || null);
    });
  });
}

async function showQuickCaptureView(summaryData: any) {
  document.body.dataset.capture = "active";
  const textEl = document.getElementById("qc-summary-text");
  const generatedTitleEl = document.getElementById("qc-generated-title");
  const titleEl = document.getElementById("qc-source-title");
  const urlEl = document.getElementById("qc-source-url");
  
  const extracted = extractTitleAndSummary(String(summaryData.summaryText ?? ""));
  const cleanedSummaryText = extracted.summaryText;
  const resolvedTitle = (extracted.title ?? "").trim() || deriveSummaryTitle(cleanedSummaryText);

  if (generatedTitleEl) generatedTitleEl.textContent = resolvedTitle;
  if (textEl) textEl.textContent = cleanedSummaryText || "";
  if (titleEl) titleEl.textContent = resolvedTitle;
  
  if (urlEl) {
    try {
      const u = new URL(summaryData.url);
      urlEl.textContent = u.hostname.toUpperCase();
    } catch {
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
  
  const saveBtn = document.getElementById("qc-save-btn") as HTMLButtonElement | null;
  if(saveBtn) saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Memory`;
  const tagsInput = document.getElementById("qc-tags-input") as HTMLInputElement | null;
  if(tagsInput) tagsInput.value = "";
  qcHideTagSuggest();
  qcSetSelectedWorkspaceId("");
  qcCloseWorkspaceMenu();
}

async function fetchWorkspaces(token: string) {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      const items = rawItems.map((w: unknown) => {
        const obj = asObject(w);
        return {
          id: pickId(obj),
          name: String(obj.name ?? "Untitled"),
        };
      });
      qcRenderWorkspaceOptions(items.filter((x: { id: string }) => x.id.length > 0));
    }
  } catch (e) {
    console.error("Failed to load workspaces", e);
  }
}

async function saveSummary(summaryData: any, token: string) {
  const saveBtn = document.getElementById("qc-save-btn") as HTMLButtonElement;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const tagsInput = document.getElementById("qc-tags-input") as HTMLInputElement;

  const workspaceId = qcSelectedWorkspaceId || undefined;
  const tagsString = tagsInput?.value || "";
  const tagsTextArray = tagsString
    .split(",")
    .map((t) => normalizeTagName(t))
    .filter((t) => t.length > 0);

  let finalTagIds: string[] = [];
  for (const t of tagsTextArray) {
    try {
       const tRes = await fetch(`${API_BASE}/api/tags`, {
         method: "POST",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
         body: JSON.stringify({ name: t })
       });
       if (tRes.ok) {
         const tData = await tRes.json();
         const createdId = pickId(tData);
         if (createdId) finalTagIds.push(createdId);
       } else if (tRes.status === 400) {
         const allTagsRes = await fetch(`${API_BASE}/api/tags`, { headers: { Authorization: `Bearer ${token}` } });
         if (allTagsRes.ok) {
            const allData = await allTagsRes.json();
            const existing = allData.items.find((item: any) => item.name === t);
            const existingId = pickId(existing);
            if (existingId) finalTagIds.push(existingId);
         }
       }
    } catch {}
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
      const sourceTabId = typeof summaryData?.sourceTabId === "number" ? summaryData.sourceTabId : null;
      if (sourceTabId !== null) {
        chrome.tabs.sendMessage(sourceTabId, { type: "SHOW_CAPTURE_SAVED_INDICATOR" }, () => {
          // Ignore if the source tab no longer has an active content script.
          void chrome.runtime.lastError;
        });
      }
      hideQuickCaptureView();
      setStatus("Summary saved.");
      fetchRecentSummaries(token);
    } else {
      setStatus("Failed to save summary.");
      saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Memory`;
    }
  } catch (err) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save to Memory`;
    setStatus("Network error while saving.");
  }
}

async function fetchRecentSummaries(token: string | null) {
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
    const rawItems = Array.isArray(data?.items) ? data.items : [];
    allRecentSummaries = rawItems
      .map((raw: unknown) => {
        const obj = asObject(raw);
        const id = pickId(obj);
        if (!id) return null;
        return {
          id,
          title: String(obj.title ?? ""),
          platform: String(obj.platform ?? "Unknown") as Platform,
          createdAt: String(obj.createdAt ?? new Date().toISOString()),
        };
      })
      .filter((item: SummaryItem | null): item is SummaryItem => item !== null);
    applySummarySearch();
  } catch (err) {
    setStatus("Unable to load summaries.");
  }
}

function isSupportedConversationUrl(url: string) {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:") return false;
    return (
      hostname === "chatgpt.com" ||
      hostname === "chat.openai.com" ||
      hostname === "claude.ai" ||
      hostname === "gemini.google.com" ||
      hostname === "www.bing.com" ||
      hostname === "copilot.microsoft.com" ||
      hostname === "grok.com" ||
      hostname === "x.com"
    );
  } catch {
    return false;
  }
}

function contentScriptFileForUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    if (hostname === "chatgpt.com" || hostname === "chat.openai.com") return "dist/content-chatgpt.js";
    if (hostname === "claude.ai") return "dist/content-claude.js";
    if (hostname === "gemini.google.com") return "dist/content-gemini.js";
    if (hostname === "www.bing.com" || hostname === "copilot.microsoft.com") return "dist/content-chatgpt.js";
    if (hostname === "grok.com" || hostname === "x.com") return "dist/content-chatgpt.js";
    return null;
  } catch {
    return null;
  }
}

function detectPlatformFromUrl(url: string): Platform {
  try {
    const { hostname } = new URL(url);
    if (hostname === "chatgpt.com" || hostname === "chat.openai.com") return "ChatGPT";
    if (hostname === "claude.ai") return "Claude";
    if (hostname === "gemini.google.com") return "Gemini";
    if (hostname === "www.bing.com" || hostname === "copilot.microsoft.com") return "Bing";
    if (hostname === "grok.com" || hostname === "x.com") return "Grok";
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

async function getStoredAuth(): Promise<{ token: string | null; user: AuthUser }> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["authToken", "user"],
      (result: { authToken?: string; user?: AuthUser }) => {
        resolve({ token: result.authToken ?? null, user: result.user ?? null });
      },
    );
  });
}

async function setStoredAuth(token: string, user: AuthUser) {
  return new Promise<void>((resolve) => {
    chrome.storage.sync.set({ authToken: token, user }, () => resolve());
  });
}

async function clearStoredAuth() {
  return new Promise<void>((resolve) => {
    chrome.storage.sync.remove(["authToken", "user"], () => resolve());
  });
}

async function fetchMe(token: string) {
  const res = await fetch(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return (await res.json()) as { id: string; email: string; name: string; avatar?: string };
}

function applyAuthTheme(isAuthed: boolean) {
  document.body.dataset.auth = isAuthed ? "in" : "out";
}

function renderUser(user: AuthUser) {
  const avatarEl = document.getElementById("user-avatar") as HTMLImageElement | null;
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
    if (nameEl) nameEl.textContent = user.name || "Signed in";
    if (emailEl) emailEl.textContent = user.email || "";
    if (signedOutEl) signedOutEl.style.display = "none";
    if (signedInEl) signedInEl.style.display = "flex";
    applyAuthTheme(true);
  } else {
    if (avatarEl) avatarEl.style.display = "none";
    if (nameEl) nameEl.textContent = "";
    if (emailEl) emailEl.textContent = "";
    if (signedOutEl) signedOutEl.style.display = "flex";
    if (signedInEl) signedInEl.style.display = "none";
    applyAuthTheme(false);
  }
}

async function init() {
  const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
  const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
  const captureBtn = document.getElementById("agent-capture-btn") as HTMLButtonElement | null;

  let { token: authToken, user: cachedUser } = await getStoredAuth();

  function updateAuthUI() {
    if (captureBtn) captureBtn.disabled = !authToken;
  }

  updateAuthUI();

  function buildContinuePrompt(title: string, summaryText: string): string {
    return [
      "Use this summary as context and continue the conversation from it.",
      "",
      `Title: ${title}`,
      "",
      "Summary:",
      String(summaryText ?? "").trim(),
    ].join("\n");
  }

  async function ensureContentScriptForTab(tabId: number, tabUrl: string): Promise<void> {
    const file = contentScriptFileForUrl(tabUrl);
    if (!file) return;
    await new Promise<void>((resolve) => {
      chrome.scripting.executeScript(
        { target: { tabId }, files: [file], world: "ISOLATED" },
        () => resolve(),
      );
    });
  }

  insertSummaryHandler = async (summaryId: string) => {
    if (!authToken) {
      setStatus("Please sign in first.");
      return;
    }

    setStatus("Inserting into active AI…");

    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const tabId = activeTab?.id;
    const tabUrl = activeTab?.url;

    if (!tabId || !tabUrl) {
      setStatus("No active tab.");
      return;
    }

    if (!isSupportedConversationUrl(tabUrl)) {
      setStatus("Open a ChatGPT, Claude, Gemini, Copilot, or Grok chat tab to insert.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/summaries/${encodeURIComponent(summaryId)}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) {
      setStatus("Unable to load summary details.");
      return;
    }

    const summary = await res.json();
    const title = String(summary?.title ?? "");
    const summaryText = String(summary?.summaryText ?? "");
    const prompt = buildContinuePrompt(title, summaryText);

    const payload = { type: "INJECT_CONTINUE_PROMPT", prompt };

    await new Promise<void>((resolve) => {
      chrome.tabs.sendMessage(tabId, payload, async (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          // If the receiver isn't ready yet, inject and retry once.
          await ensureContentScriptForTab(tabId, tabUrl);
          window.setTimeout(() => {
            chrome.tabs.sendMessage(tabId, payload, (response2) => {
              const err2 = chrome.runtime.lastError;
              if (err2) {
                setStatus(`Insert failed: ${err2.message}`);
                resolve();
                return;
              }
              const ok = Boolean((response2 as any)?.ok);
              const reason =
                (response2 as any)?.reason ||
                (response2 as any)?.error ||
                "Insert failed.";
              if (ok) {
                setStatus("Inserted. Continue in the input box.");
                resolve();
                return;
              }
              void navigator.clipboard
                .writeText(prompt)
                .then(() =>
                  setStatus(
                    `Could not insert automatically. Prompt copied - paste into the input box. (${String(reason)})`,
                  ),
                )
                .catch(() => setStatus(`Could not insert automatically. (${String(reason)})`));
              resolve();
            });
          }, 500);
          return;
        }

        const ok = Boolean((response as any)?.ok);
        const reason =
          (response as any)?.reason || (response as any)?.error || "Insert failed.";

        if (ok) {
          setStatus("Inserted. Continue in the input box.");
          resolve();
          return;
        }

        void navigator.clipboard
          .writeText(prompt)
          .then(() =>
            setStatus(
              `Could not insert automatically. Prompt copied - paste into the input box. (${String(reason)})`,
            ),
          )
          .catch(() => setStatus(`Could not insert automatically. (${String(reason)})`));
        resolve();

      });
    });
  };

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
    } catch {
      authToken = null;
      cachedUser = null;
      await clearStoredAuth();
      renderUser(null);
      setStatus("Please sign in.");
    }
  } else {
    renderUser(null);
    setStatus("Please sign in.");
  }

  try {
    await fetchRecentSummaries(authToken);
  } catch (err) {
    // If backend is down/unreachable, we still want the popup to stay usable.
    console.warn("Failed to fetch recent summaries", err);
  }

  const searchInput = document.getElementById("memories-search-input") as HTMLInputElement | null;
  searchInput?.addEventListener("input", () => {
    currentSummarySearch = searchInput.value || "";
    applySummarySearch();
  });

  const qcTagsInput = qcGetTagsInputEl();
  qcTagsInput?.addEventListener("input", () => {
    if (!authToken) return;
    const { query } = qcActiveSegment(qcTagsInput.value || "");
    void qcFetchTagSuggest(authToken, query);
  });
  qcTagsInput?.addEventListener("focus", () => {
    if (!authToken) return;
    const { query } = qcActiveSegment(qcTagsInput.value || "");
    void qcFetchTagSuggest(authToken, query);
  });
  qcTagsInput?.addEventListener("blur", () => {
    // delay so click can apply selection
    window.setTimeout(() => qcHideTagSuggest(), 120);
  });
  qcTagsInput?.addEventListener("keydown", (e) => {
    if (!qcTagSuggestItems.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      qcTagSuggestActiveIndex = Math.min(qcTagSuggestActiveIndex + 1, qcTagSuggestItems.length - 1);
      qcRenderTagSuggest();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      qcTagSuggestActiveIndex = Math.max(qcTagSuggestActiveIndex - 1, 0);
      qcRenderTagSuggest();
    } else if (e.key === "Enter") {
      const active = qcTagSuggestItems[qcTagSuggestActiveIndex];
      if (!active) return;
      e.preventDefault();
      qcApplyTagSuggestion(active.name);
    } else if (e.key === "Escape") {
      qcHideTagSuggest();
    }
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
      const r = response as
        | { ok: true; opened: true }
        | { ok: false; error?: string }
        | undefined;
      if (!r || !r.ok) {
        const errMsg =
          r && "error" in r && typeof r.error === "string" ? r.error : "Could not start sign-in.";
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
    const searchInputEl = document.getElementById("memories-search-input") as HTMLInputElement | null;
    if (searchInputEl) searchInputEl.value = "";
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
    const li = (e.target as HTMLElement).closest("li.qc-workspace-option") as HTMLElement | null;
    if (!li) return;
    qcSetSelectedWorkspaceId(li.dataset.value ?? "");
    qcCloseWorkspaceMenu();
  });

  document.addEventListener("click", () => {
    qcCloseWorkspaceMenu();
    qcHideTagSuggest();
  });

  const startCapture = () => {
    if (!authToken) {
      setStatus("Please sign in first.");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs: chrome.tabs.Tab[]) => {
      const tabUrl = tabs[0]?.url;
      if (!tabUrl) {
        setStatus("No active tab URL.");
        return;
      }
      if (!isSupportedConversationUrl(tabUrl)) {
        setStatus("Open a ChatGPT, Claude, or Gemini tab to capture.");
        return;
      }
      const detectedPlatform = detectPlatformFromUrl(tabUrl);
      if (
        detectedPlatform !== "ChatGPT" &&
        detectedPlatform !== "Claude" &&
        detectedPlatform !== "Gemini"
      ) {
        setStatus("Open a ChatGPT, Claude, or Gemini tab to capture.");
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

        chrome.scripting.executeScript(
          { target: { tabId }, files: [file], world: "ISOLATED" },
          () => {
          const injErr = chrome.runtime.lastError;
          if (injErr) {
            setStatus(`Cannot inject into this tab: ${injErr.message}`);
            return;
          }
          trySend();
        },
        );
      });
    });
  };

  captureBtn?.addEventListener("click", () => {
    startCapture();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes.authToken) return;
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
      const searchInputEl = document.getElementById("memories-search-input") as HTMLInputElement | null;
      if (searchInputEl) searchInputEl.value = "";
      renderSummaries([]);
      setStatus("Signed out.");
      return;
    }
    if (typeof next !== "string" || !next.length) return;
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
      } catch {
        setStatus("Signed in, but could not refresh profile. Try reopening the popup.");
      }
    })();
  });

  chrome.runtime.onMessage.addListener((message: any) => {
    if (message.type === "SUMMARIZE_STATUS") {
      if (message.status === "waiting_ai") {
        setStatus("Waiting for AI to respond...");
      } else if (message.status === "ready_to_review") {
        checkPendingSummary().then(pending => {
           if (pending && authToken) {
              currentPendingSummary = pending;
              showQuickCaptureView(pending);
           }
        });
      } else if (message.status === "saved") {
        setStatus("Summary saved.");
        if (authToken) {
          fetchRecentSummaries(authToken);
        }
      } else if (message.status === "error") {
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

