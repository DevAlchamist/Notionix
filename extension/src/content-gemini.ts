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
  const textarea = document.querySelector<HTMLTextAreaElement>(
    "textarea[aria-label*='Message'], textarea[placeholder*='Message'], textarea[placeholder*='message'], textarea",
  );
  if (textarea) return textarea;

  const div = document.querySelector<HTMLDivElement>(
    "div[contenteditable='true'][role='textbox'], div[contenteditable='plaintext-only'][role='textbox'], div[contenteditable='true'], div[contenteditable='plaintext-only']",
  );
  return div;
}

export function getSendButton(): HTMLButtonElement | null {
  const btn =
    document.querySelector<HTMLButtonElement>("button[type='submit']") ||
    document.querySelector<HTMLButtonElement>("button[aria-label*='Send']") ||
    document.querySelector<HTMLButtonElement>("button[aria-label='Send message']");
  return btn ?? null;
}

export async function insertPromptAndSend() {
  const input = await waitFor(getInputElement, 10000);
  const sendBtn = await waitFor(getSendButton, 10000);
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

  const assistantSelector =
    "[data-role='model-response'], [data-testid='model-response']";
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
  const enabledBtn = await waitFor(() => {
    const btn = getSendButton();
    return btn && !btn.disabled ? btn : null;
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

  watchForSummaryResponse(beforeAssistantCount, beforeAssistantLastText);
}

export function extractLatestAssistantMessage(): string | null {
  const messageBlocks = document.querySelectorAll<HTMLElement>("[data-role='model-response'], [data-testid='model-response']");
  const last = messageBlocks[messageBlocks.length - 1];
  if (!last) return null;
  return last.innerText.trim();
}

export function watchForSummaryResponse(
  beforeAssistantCount: number,
  beforeAssistantLastText: string | null,
  timeoutMs = 60000,
) {
  const container = document.body;
  const observer = new MutationObserver(() => {
    const messageBlocks = document.querySelectorAll<HTMLElement>(
      "[data-role='model-response'], [data-testid='model-response']",
    );
    const currentCount = messageBlocks.length;
    const last = messageBlocks[messageBlocks.length - 1];
    if (!last) return;
    const text = last.innerText.trim();
    if (!text) return;

    if (currentCount < beforeAssistantCount) return;

    if (currentCount === beforeAssistantCount) {
      if (beforeAssistantLastText && text === beforeAssistantLastText) return;
    }
    if (
      currentCount > beforeAssistantCount &&
      beforeAssistantLastText &&
      text === beforeAssistantLastText
    ) {
      return;
    }

    observer.disconnect();
    if (timeoutId) window.clearTimeout(timeoutId);

    chrome.runtime.sendMessage({
      type: "SUMMARY_COMPLETE",
      platform: "Gemini",
      summaryText: text,
      url: window.location.href,
      createdAt: new Date().toISOString(),
    });
  });

  let timeoutId: number | undefined = window.setTimeout(() => {
    observer.disconnect();
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "error",
      reason: "Timed out waiting for Gemini to finish generating the summary.",
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

