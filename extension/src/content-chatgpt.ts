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

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLTextAreaElement) return el;
    if (el instanceof HTMLDivElement) return el;
  }

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

  // Prefer the control in the same composer as the input (multiple / hidden UIs can confuse globals).
  if (composerInput) {
    const near = findSendControlNearInput(composerInput);
    if (near) return near;
  }

  for (const sel of globalSelectors) {
    const el = document.querySelector(sel);
    if (el instanceof HTMLElement) return el;
  }

  return null;
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

export async function insertPromptAndSend() {
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
  );
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

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  if (message.type === "INJECT_SUMMARY_PROMPT") {
    sendResponse({ ok: true });
    insertPromptAndSend();
    return;
  }
  sendResponse({ ok: false });
});

