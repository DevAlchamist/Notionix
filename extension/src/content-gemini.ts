import {
  setFloatingCaptureButtonLoading,
  startFloatingCaptureButtonObserver,
} from "./captureButton.js";

export const SUMMARY_PROMPT = `Summarize the conversation above.

Output format (exact labels):
Title: <a concise, specific title>
Summary:
<1–2 short paragraphs capturing context and the main outcome>
- <5–10 bullet points with key details, decisions, constraints, and action items (if any)>

Important:
- Keep it clear, concrete, and skimmable.
- Do not add extra sections beyond Title and Summary.`;

const ASSISTANT_SELECTORS = [
  "[data-role='model-response']",
  "[data-testid='model-response']",
  "[data-message-author-role='assistant']",
  "[data-role='assistant']",
  "article[data-testid*='assistant']",
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor<T>(
  getter: () => T | null,
  timeoutMs: number,
  intervalMs = 250,
): Promise<T | null> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = getter();
    if (value) return value;
    await delay(intervalMs);
  }
  return getter();
}

export function getInputElement(): HTMLTextAreaElement | HTMLDivElement | null {
  const selectors = [
    "textarea[aria-label*='Message']",
    "textarea[placeholder*='Message']",
    "textarea[placeholder*='message']",
    "textarea",
    "div[contenteditable='true'][role='textbox']",
    "div[contenteditable='plaintext-only'][role='textbox']",
    "div[contenteditable='true']",
    "div[contenteditable='plaintext-only']",
  ];
  const candidates: Array<HTMLTextAreaElement | HTMLDivElement> = [];
  for (const sel of selectors) {
    const nodes = document.querySelectorAll(sel);
    for (const node of Array.from(nodes)) {
      if ((node instanceof HTMLTextAreaElement || node instanceof HTMLDivElement) && isElementVisible(node)) {
        candidates.push(node);
      }
    }
  }
  if (!candidates.length) return null;
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    for (const c of candidates) {
      if (c === active || c.contains(active)) return c;
    }
  }
  return candidates[candidates.length - 1] ?? null;
}

export function getSendButton(): HTMLButtonElement | null {
  const selectors = [
    "button[type='submit']",
    "button[aria-label*='Send']",
    "button[aria-label='Send message']",
  ];
  for (const sel of selectors) {
    const nodes = document.querySelectorAll<HTMLButtonElement>(sel);
    for (const node of Array.from(nodes)) {
      if (isElementVisible(node)) return node;
    }
  }
  return null;
}

function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (el.offsetParent === null && style.position !== "fixed") return false;
  return true;
}

function getComposerRootFromInput(input: HTMLElement): HTMLElement {
  let walk: HTMLElement | null = input;
  for (let d = 0; d < 10 && walk; d++) {
    if (walk.tagName === "FORM" || walk.getAttribute("role") === "form") return walk;
    walk = walk.parentElement;
  }
  return input.parentElement ?? input;
}

function getSendButtonForInput(input: HTMLTextAreaElement | HTMLDivElement | null): HTMLButtonElement | null {
  if (!input) return null;
  let walk: HTMLElement | null = input;
  for (let depth = 0; depth < 12 && walk; depth++) {
    const local = walk.querySelectorAll<HTMLButtonElement>(
      "button[type='submit'],button[aria-label*='Send'],button[aria-label='Send message']",
    );
    for (const btn of Array.from(local)) {
      if (isElementVisible(btn) && walk.contains(btn)) return btn;
    }
    walk = walk.parentElement;
  }
  return null;
}

function getScopedSendButtonForMount(): HTMLButtonElement | null {
  const input = getInputElement();
  if (!input) return null;
  const local = getSendButtonForInput(input);
  if (local) return local;
  const root = getComposerRootFromInput(input);
  const nearby = root.querySelectorAll<HTMLButtonElement>(
    "button[type='submit'],button[aria-label*='Send'],button[aria-label='Send message']",
  );
  for (const btn of Array.from(nearby)) {
    if (isElementVisible(btn)) return btn;
  }
  return null;
}

export async function insertPromptAndSend(autoSave = false) {
  const input = await waitFor(getInputElement, 10000);
  const sendBtn = await waitFor(() => {
    const scoped = getSendButtonForInput(input);
    if (scoped) return scoped;
    const global = getSendButton();
    return global && isElementVisible(global) ? global : null;
  }, 10000);
  if (!input) {
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "error",
      reason: "Unable to find chat input in Gemini.",
    });
    return;
  }
  if (!sendBtn) {
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "error",
      reason: "Unable to find send button in Gemini (composer not ready).",
    });
    return;
  }

  const beforeAssistantCount = getAssistantMessageBlocks().length;
  const beforeAssistantLastText = extractLatestAssistantMessage();

  if (input instanceof HTMLTextAreaElement) {
    input.focus();
    input.value = SUMMARY_PROMPT;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    input.focus();
    input.textContent = SUMMARY_PROMPT;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  await delay(150);
  const enabledBtn = await waitFor(() => {
    const scoped = getSendButtonForInput(input);
    const btn = scoped ?? getSendButton();
    return btn && !btn.disabled && isElementVisible(btn) ? btn : null;
  }, 5000);
  try {
    (enabledBtn ?? sendBtn).click();
  } catch {
    // Let the mutation observer still capture the assistant response.
  }

  chrome.runtime.sendMessage({
    type: "SUMMARIZE_STATUS",
    status: "waiting_ai",
  });

  watchForSummaryResponse(beforeAssistantCount, beforeAssistantLastText, autoSave);
}


function readContinuationPromptFromUrl(): string | null {
  try {
    const u = new URL(window.location.href);
    const raw = u.searchParams.get("air_continue");
    if (!raw) return null;
    const prompt = raw.trim();
    return prompt.length > 0 ? prompt : null;
  } catch {
    return null;
  }
}

async function prefillContinuationPromptFromUrl(): Promise<void> {
  const prompt = readContinuationPromptFromUrl();
  if (!prompt) return;
  const input = await waitFor(getInputElement, 15000);
  if (!input) return;

  if (input instanceof HTMLTextAreaElement) {
    input.focus();
    input.value = prompt;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  input.focus();
  input.innerText = prompt;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function insertContinuePromptIntoInput(prompt: string): Promise<void> {
  const trimmed = String(prompt ?? "").trim();
  if (!trimmed) return;

  const input = await waitFor(getInputElement, 15000);
  if (!input) throw new Error("Unable to find chat input.");

  if (input instanceof HTMLTextAreaElement) {
    const existing = String(input.value ?? "");
    const next = existing.trim().length ? `${existing}\n\n${trimmed}` : trimmed;
    input.focus();
    input.value = next;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  const existing = String(input.innerText ?? "");
  const next = existing.trim().length ? `${existing}\n\n${trimmed}` : trimmed;
  input.focus();
  input.innerText = next;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export function extractLatestAssistantMessage(): string | null {
  const messageBlocks = getAssistantMessageBlocks();
  const last = messageBlocks[messageBlocks.length - 1];
  return normalizeText(last?.innerText);
}

export function watchForSummaryResponse(
  beforeAssistantCount: number,
  beforeAssistantLastText: string | null,
  autoSave: boolean,
  timeoutMs = 60000,
) {
  const container = document.body;
  const quietPeriodMs = 3000;
  let quietTimerId: number | undefined;
  let lastSeenText: string | null = null;
  let newMessageStarted = false;

  const accept = () => {
    const latestText = extractLatestAssistantMessage() ?? "";
    if (!latestText) return;
    if (lastSeenText && latestText !== lastSeenText) return;

    observer.disconnect();
    if (timeoutId) window.clearTimeout(timeoutId);
    if (quietTimerId) window.clearTimeout(quietTimerId);

    chrome.runtime.sendMessage({
      type: "SUMMARY_COMPLETE",
      platform: "Gemini",
      summaryText: latestText,
      url: window.location.href,
      createdAt: new Date().toISOString(),
      autoSave,
    });
  };

  const observer = new MutationObserver(() => {
    const messageBlocks = getAssistantMessageBlocks();
    const currentCount = messageBlocks.length;
    const last = messageBlocks[messageBlocks.length - 1];
    if (!last) return;
    const text = normalizeText(last.innerText);
    if (!text) return;

    if (currentCount < beforeAssistantCount) return;

    if (!newMessageStarted) {
      if (currentCount === beforeAssistantCount) {
        if (beforeAssistantLastText && text === beforeAssistantLastText) return;
      } else if (
        currentCount > beforeAssistantCount &&
        beforeAssistantLastText &&
        text === beforeAssistantLastText
      ) {
        return;
      }
      newMessageStarted = true;
      lastSeenText = text;
    } else if (text !== lastSeenText) {
      lastSeenText = text;
    } else {
      return;
    }

    if (quietTimerId) window.clearTimeout(quietTimerId);
    quietTimerId = window.setTimeout(() => accept(), quietPeriodMs);
  });

  let timeoutId: number | undefined = window.setTimeout(() => {
    observer.disconnect();
    if (quietTimerId) window.clearTimeout(quietTimerId);
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "error",
      reason: "Timed out waiting for Gemini to finish generating the summary (waiting for stable output).",
    });
  }, timeoutMs);

  observer.observe(container, {
    childList: true,
    subtree: true,
  });
}

function normalizeText(value: string | null | undefined): string | null {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function getAssistantMessageBlocks(): HTMLElement[] {
  for (const selector of ASSISTANT_SELECTORS) {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((node) =>
      normalizeText(node.innerText),
    );
    if (blocks.length) return blocks;
  }
  return [];
}

function showCaptureIndicator(message: string, tone: "success" | "error" = "success") {
  const id = "ai-remember-capture-indicator";
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const node = document.createElement("div");
  node.id = id;
  node.textContent = message;
  node.style.position = "fixed";
  node.style.top = "14px";
  node.style.right = "14px";
  node.style.zIndex = "2147483647";
  node.style.padding = "8px 12px";
  node.style.borderRadius = "10px";
  node.style.fontSize = "12px";
  node.style.fontWeight = "600";
  node.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
  node.style.color = "#fff";
  node.style.background = tone === "success" ? "#127a3f" : "#8a1c1c";
  document.documentElement.appendChild(node);
  window.setTimeout(() => node.remove(), 3200);
}

function startCaptureButtonObserver() {
  startFloatingCaptureButtonObserver({
    buttonText: "Capture",
    onClick: () => {
      setFloatingCaptureButtonLoading(true, "Working…");
      insertPromptAndSend(true).catch(() => {
        showCaptureIndicator("Capture failed to start", "error");
        setFloatingCaptureButtonLoading(false);
      });
    },
  });
}

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  if (message.type === "SUMMARIZE_STATUS") {
    const status = String(message?.status ?? "");
    if (status === "error" || status === "ready_to_review" || status === "saved") {
      setFloatingCaptureButtonLoading(false);
    }
  }
  if (message.type === "INJECT_SUMMARY_PROMPT") {
    sendResponse({ ok: true });
    insertPromptAndSend(Boolean(message?.autoSave));
    return;
  }
  if (message.type === "INJECT_CONTINUE_PROMPT") {
    void insertContinuePromptIntoInput(String(message?.prompt ?? ""))
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, reason: String(err?.message ?? err) }));
    return true;
  }
  if (message.type === "PING_CAPTURE_READY") {
    sendResponse({ ok: true });
    return;
  }
  if (message.type === "SHOW_CAPTURE_SAVED_INDICATOR") {
    sendResponse({ ok: true });
    showCaptureIndicator("Saved to Memory");
    setFloatingCaptureButtonLoading(false);
    return;
  }
  if (message.type === "SHOW_CAPTURE_ERROR_INDICATOR") {
    sendResponse({ ok: true });
    const reason =
      typeof message?.reason === "string" && message.reason.trim().length
        ? message.reason.trim()
        : "Capture could not be saved.";
    showCaptureIndicator(reason, "error");
    setFloatingCaptureButtonLoading(false);
    return;
  }
  sendResponse({ ok: false });
});

startCaptureButtonObserver();
void prefillContinuationPromptFromUrl();

