import { startFloatingCaptureButtonObserver } from "./captureButton.js";

export const SUMMARY_PROMPT = `Summarize the conversation above.

Output format (exact labels):
Title: <a concise, specific title>
Summary:
<1–2 short paragraphs capturing context and the main outcome>
- <5–10 bullet points with key details, decisions, constraints, and action items (if any)>

Important:
- Keep it clear, concrete, and skimmable.
- Do not add extra sections beyond Title and Summary.`;

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
    // Current ChatGPT commonly uses this id
    "textarea#prompt-textarea",
    // Newer UIs often add aria-label/placeholder variations
    "textarea[aria-label*='Message']",
    "textarea[aria-label*='message']",
    "textarea[placeholder*='Message']",
    "textarea[placeholder*='message']",
    // Fallbacks seen across UI iterations
    "textarea[data-id='root']",
    // Rich editor variants
    "div[contenteditable='true'][role='textbox']",
    "div[contenteditable='true'][data-id='root']",
    "div[contenteditable='plaintext-only'][role='textbox']",
    "div[contenteditable='plaintext-only'][data-id='root']",
    "div[contenteditable][role='textbox']",
    "div[contenteditable]:not([contenteditable='false'])",
    "div[contenteditable='true']",
  ];

  const candidates: Array<HTMLTextAreaElement | HTMLDivElement> = [];
  for (const sel of selectors) {
    const list = document.querySelectorAll(sel);
    for (const el of Array.from(list)) {
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLDivElement) {
        if (isElementVisible(el)) candidates.push(el);
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

  return null;
}

/** True if the control can be clicked to send (buttons vs div[role=button] / composer). */
function isSendControlEnabled(el: HTMLElement): boolean {
  if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
    return !el.disabled && el.getAttribute("aria-disabled") !== "true";
  }
  if (el.getAttribute("aria-disabled") === "true") return false;
  if (el.hasAttribute("disabled")) return false;
  return true;
}

/**
 * Walk up from the composer input; search each ancestor subtree for the send control.
 * Newer ChatGPT often keeps submit next to the editor under a shared parent (not document-global).
 */
function findSendControlNearInput(composerInput: HTMLElement): HTMLElement | null {
  const selectors = [
    "#composer-submit-button",
    "[data-testid='composer-submit-button']",
    "button[data-testid='send-button']",
    "[data-testid='send-button']",
    "button[aria-label='Send prompt']",
    "button[aria-label='Send message']",
    // Localized / variant labels
    "button[aria-label*='Send']",
    "button[aria-label*='send']",
    "div[role='button'][aria-label*='Send']",
    "div[role='button'][aria-label*='send']",
    "button[type='submit']",
  ];

  let walk: HTMLElement | null = composerInput;
  for (let d = 0; d < 28 && walk; d++) {
    for (const sel of selectors) {
      const hit = walk.querySelector(sel);
      if (hit instanceof HTMLElement) return hit;
    }
    walk = walk.parentElement;
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
    const role = walk.getAttribute("role");
    if (
      walk.tagName === "FORM" ||
      role === "form" ||
      walk.hasAttribute("data-testid") ||
      walk.getAttribute("aria-label")?.toLowerCase().includes("message")
    ) {
      return walk;
    }
    walk = walk.parentElement;
  }
  return input.parentElement ?? input;
}

function findSendControlInRoot(root: HTMLElement): HTMLElement | null {
  const selectors = [
    "#composer-submit-button",
    "[data-testid='composer-submit-button']",
    "button[data-testid='send-button']",
    "[data-testid='send-button']",
    "button[aria-label='Send prompt']",
    "button[aria-label='Send message']",
    "button[aria-label*='Send']",
    "button[aria-label*='send']",
    "div[role='button'][aria-label*='Send']",
    "div[role='button'][aria-label*='send']",
    "button[type='submit']",
  ];
  for (const sel of selectors) {
    const nodes = root.querySelectorAll<HTMLElement>(sel);
    for (const node of Array.from(nodes)) {
      if (isElementVisible(node)) return node;
    }
  }
  return null;
}

export function getSendControl(composerInput: HTMLElement | null): HTMLElement | null {
  const globalSelectors = [
    "#composer-submit-button",
    "[data-testid='composer-submit-button']",
    "button[data-testid='send-button']",
    "[data-testid='send-button']",
    "button[aria-label='Send prompt']",
    "button[aria-label='Send message']",
    "button[aria-label*='Send']",
    "button[aria-label*='send']",
    "div[role='button'][aria-label*='Send']",
    "div[role='button'][aria-label*='send']",
    "button[type='submit']",
  ];

  // Prefer the control in the same active composer.
  if (composerInput) {
    const composerRoot = getComposerRootFromInput(composerInput);
    const near =
      findSendControlInRoot(composerRoot) ??
      findSendControlNearInput(composerInput);
    if (near) return near;
  }

  for (const sel of globalSelectors) {
    const all = document.querySelectorAll<HTMLElement>(sel);
    for (const el of Array.from(all)) {
      if (isElementVisible(el)) return el;
    }
  }

  return null;
}

function getScopedSendControlForMount(): HTMLElement | null {
  const input = getInputElement();
  if (!input) return null;
  const composerRoot = getComposerRootFromInput(input);
  return (
    findSendControlInRoot(composerRoot) ??
    findSendControlNearInput(input)
  );
}

/** Enter / Ctrl|Cmd+Enter fallbacks when click fails or submit stays disabled (multiline composer). */
function trySubmitViaKeyboard(composerInput: HTMLTextAreaElement | HTMLDivElement): void {
  const base: KeyboardEventInit = {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  };
  composerInput.dispatchEvent(new KeyboardEvent("keydown", base));
  composerInput.dispatchEvent(
    new KeyboardEvent("keyup", { ...base }),
  );
  const isMac = /Mac|iPhone|iPod|iPad/i.test(
    typeof navigator !== "undefined" ? navigator.platform : "",
  );
  composerInput.dispatchEvent(
    new KeyboardEvent("keydown", {
      ...base,
      ...(isMac ? { metaKey: true } : { ctrlKey: true }),
    }),
  );
}

export async function insertPromptAndSend(autoSave = false) {
  const input = await waitFor(getInputElement, 10000);

  if (!input) {
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "error",
      reason: "Unable to find chat input in ChatGPT.",
    });
    return;
  }

  const assistantSelector = "[data-message-author-role='assistant']";
  const beforeAssistantCount = document.querySelectorAll<HTMLElement>(
    assistantSelector,
  ).length;
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

  // Prefer clicking the enabled send control (when present), but fall back to
  // keyboard submission even if ChatGPT doesn't expose a clickable element yet.
  const enabledSendControl = await waitFor(() => {
    const control = getSendControl(input as HTMLElement);
    return control && isSendControlEnabled(control) ? control : null;
  }, 5000);

  let submitted = false;
  if (enabledSendControl) {
    try {
      enabledSendControl.click();
      submitted = true;
    } catch {
      submitted = false;
    }
  }

  if (!submitted) {
    trySubmitViaKeyboard(input);
  }

  chrome.runtime.sendMessage({
    type: "SUMMARIZE_STATUS",
    status: "waiting_ai",
  });

  watchForSummaryResponse(
    beforeAssistantCount,
    beforeAssistantLastText,
    autoSave,
  );
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

  const existing = String(input.textContent ?? "");
  const next = existing.trim().length ? `${existing}\n\n${trimmed}` : trimmed;
  input.focus();
  input.innerText = next;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export function extractLatestAssistantMessage(): string | null {
  const messageBlocks = document.querySelectorAll<HTMLElement>(
    "[data-message-author-role='assistant']",
  );
  const last = messageBlocks[messageBlocks.length - 1];
  if (!last) return null;
  return last.innerText.trim();
}

export function watchForSummaryResponse(
  beforeAssistantCount: number,
  beforeAssistantLastText: string | null,
  autoSave: boolean,
  timeoutMs = 60000,
) {
  const assistantSelector = "[data-message-author-role='assistant']";
  const container = document.body;
  const quietPeriodMs = 3000;

  let timeoutId: number | undefined;
  let quietTimerId: number | undefined;

  let newMessageStarted = false;
  let lastSeenText: string | null = null;

  const accept = () => {
    const messageBlocks = document.querySelectorAll<HTMLElement>(assistantSelector);
    const last = messageBlocks[messageBlocks.length - 1];
    const latestText = last?.innerText?.trim() ?? "";
    if (!latestText) return;

    // Ensure the message didn't change since the debounce timer started.
    if (lastSeenText && latestText !== lastSeenText) return;

    observer.disconnect();
    if (timeoutId) window.clearTimeout(timeoutId);

    chrome.runtime.sendMessage({
      type: "SUMMARY_COMPLETE",
      platform: "ChatGPT",
      summaryText: latestText,
      url: window.location.href,
      createdAt: new Date().toISOString(),
      autoSave,
    });
  };

  const observer = new MutationObserver(() => {
    const messageBlocks = document.querySelectorAll<HTMLElement>(assistantSelector);
    const currentCount = messageBlocks.length;
    const last = messageBlocks[messageBlocks.length - 1];
    if (!last) return;

    const text = last.innerText.trim();
    if (!text) return;

    if (currentCount < beforeAssistantCount) return;

    // Start the timer only once we detect the assistant message has advanced
    // beyond the baseline response.
    if (!newMessageStarted) {
      if (currentCount === beforeAssistantCount) {
        if (beforeAssistantLastText && text === beforeAssistantLastText) return;
      } else if (
        beforeAssistantLastText &&
        currentCount > beforeAssistantCount &&
        text === beforeAssistantLastText
      ) {
        return;
      }

      newMessageStarted = true;
      lastSeenText = text;
    } else if (text !== lastSeenText) {
      lastSeenText = text;
    } else {
      // No change in text; ignore. The quiet timer will fire after streaming stops.
      return;
    }

    if (quietTimerId) window.clearTimeout(quietTimerId);
    quietTimerId = window.setTimeout(() => accept(), quietPeriodMs);
  });

  timeoutId = window.setTimeout(() => {
    observer.disconnect();
    if (quietTimerId) window.clearTimeout(quietTimerId);
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "error",
      reason:
        "Timed out waiting for ChatGPT to finish generating the summary (waiting for stable output).",
    });
  }, timeoutMs);

  observer.observe(container, {
    childList: true,
    subtree: true,
  });
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
  node.style.maxWidth = "300px";
  node.style.whiteSpace = "nowrap";
  node.style.overflow = "hidden";
  node.style.textOverflow = "ellipsis";
  document.documentElement.appendChild(node);

  window.setTimeout(() => node.remove(), 3200);
}


function readContinuationPromptFromUrl(): string | null {
  try {
    const u = new URL(window.location.href);
    const fromCustom = u.searchParams.get("air_continue");
    const fromQ = u.searchParams.get("q");
    const raw = fromCustom ?? fromQ;
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

function startCaptureButtonObserver() {
  startFloatingCaptureButtonObserver({
    buttonText: "Capture",
    onClick: () => {
      insertPromptAndSend(true).catch(() => {
        chrome.runtime.sendMessage({
          type: "SUMMARIZE_STATUS",
          status: "error",
          reason: "Could not start capture on this page.",
        });
        showCaptureIndicator("Capture failed to start", "error");
      });
    },
  });
}

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
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
    return;
  }
  if (message.type === "SHOW_CAPTURE_ERROR_INDICATOR") {
    sendResponse({ ok: true });
    const reason =
      typeof message?.reason === "string" && message.reason.trim().length
        ? message.reason.trim()
        : "Capture could not be saved.";
    showCaptureIndicator(reason, "error");
    return;
  }
  sendResponse({ ok: false });
});

startCaptureButtonObserver();
void prefillContinuationPromptFromUrl();

