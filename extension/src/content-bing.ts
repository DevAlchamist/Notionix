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

function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (el.offsetParent === null && style.position !== "fixed") return false;
  return true;
}

export function getInputElement(): HTMLTextAreaElement | HTMLDivElement | null {
  const selectors = [
    "textarea[aria-label*='Ask']",
    "textarea[placeholder*='Ask']",
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
      if (
        (node instanceof HTMLTextAreaElement || node instanceof HTMLDivElement) &&
        isElementVisible(node)
      ) {
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
    "button[aria-label*='send']",
    "button[aria-label*='Submit']",
    "button[aria-label*='submit']",
    "[role='button'][aria-label*='Send']",
    "[role='button'][aria-label*='send']",
  ];
  for (const sel of selectors) {
    const nodes = document.querySelectorAll<HTMLElement>(sel);
    for (const node of Array.from(nodes)) {
      if (node instanceof HTMLButtonElement && isElementVisible(node)) return node;
    }
  }
  return null;
}

export async function insertPromptAndSend(autoSave = false) {
  const input = await waitFor(getInputElement, 15000);
  const sendBtn = await waitFor(() => {
    const b = getSendButton();
    return b && isElementVisible(b) ? b : null;
  }, 15000);

  if (!input) {
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "error",
      reason: "Unable to find chat input in Bing/Copilot.",
    });
    return;
  }
  if (!sendBtn) {
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "error",
      reason: "Unable to find send button in Bing/Copilot (composer not ready).",
    });
    return;
  }

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
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  await delay(150);
  try {
    sendBtn.click();
  } catch {
    // Let the mutation observer still attempt capture.
  }

  chrome.runtime.sendMessage({
    type: "SUMMARIZE_STATUS",
    status: "waiting_ai",
  });

  watchForSummaryResponse(beforeAssistantLastText, autoSave);
}

export function extractLatestAssistantMessage(): string | null {
  const selectors = [
    // Copilot / Bing variants (best-effort; UI changes often)
    "cib-message-group cib-message",
    "cib-message",
    "[data-testid*='assistant']",
    "[data-role='assistant']",
    "[data-author='assistant']",
    "[data-author='bot']",
  ];
  for (const sel of selectors) {
    const nodes = document.querySelectorAll<HTMLElement>(sel);
    const last = nodes[nodes.length - 1];
    const txt = last?.innerText?.trim();
    if (txt) return txt;
  }
  return null;
}

export function watchForSummaryResponse(
  beforeAssistantLastText: string | null,
  autoSave: boolean,
  timeoutMs = 70000,
) {
  const container = document.body;
  const quietPeriodMs = 3000;

  let timeoutId: number | undefined;
  let quietTimerId: number | undefined;
  let lastSeenText: string | null = null;

  const accept = () => {
    const latestText = extractLatestAssistantMessage() ?? "";
    if (!latestText) return;
    if (lastSeenText && latestText !== lastSeenText) return;

    observer.disconnect();
    if (timeoutId) window.clearTimeout(timeoutId);

    chrome.runtime.sendMessage({
      type: "SUMMARY_COMPLETE",
      platform: "Bing",
      summaryText: latestText,
      url: window.location.href,
      createdAt: new Date().toISOString(),
      autoSave,
    });
  };

  const observer = new MutationObserver(() => {
    const text = extractLatestAssistantMessage();
    if (!text) return;

    if (beforeAssistantLastText && text === beforeAssistantLastText) return;

    if (!lastSeenText) {
      lastSeenText = text;
    } else if (text !== lastSeenText) {
      lastSeenText = text;
    } else {
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
        "Timed out waiting for Bing/Copilot to finish generating the summary (waiting for stable output).",
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
  node.style.maxWidth = "320px";
  node.style.whiteSpace = "nowrap";
  node.style.overflow = "hidden";
  node.style.textOverflow = "ellipsis";
  document.documentElement.appendChild(node);

  window.setTimeout(() => node.remove(), 3200);
}

function startCaptureButtonObserver() {
  startFloatingCaptureButtonObserver({
    buttonText: "Capture",
    onClick: () => {
      setFloatingCaptureButtonLoading(true, "Working…");
      insertPromptAndSend(true).catch(() => {
        chrome.runtime.sendMessage({
          type: "SUMMARIZE_STATUS",
          status: "error",
          reason: "Could not start capture on this page.",
        });
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

