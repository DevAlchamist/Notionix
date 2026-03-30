"use strict";
(() => {
  // src/content-claude.ts
  var SUMMARY_PROMPT = `Summarize the conversation above.

Output format (exact labels):
Title: <a concise, specific title>
Summary:
<1\u20132 short paragraphs capturing context and the main outcome>
- <5\u201310 bullet points with key details, decisions, constraints, and action items (if any)>

Important:
- Keep it clear, concrete, and skimmable.
- Do not add extra sections beyond Title and Summary.`;
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async function waitFor(getter, timeoutMs, intervalMs = 250) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const value = getter();
      if (value) return value;
      await delay(intervalMs);
    }
    return getter();
  }
  function getInputElement() {
    const textarea = document.querySelector(
      "textarea[aria-label*='Message'], textarea[placeholder*='Message'], textarea[placeholder*='message'], textarea"
    );
    if (textarea) return textarea;
    const div = document.querySelector(
      "div[contenteditable='true'][role='textbox'], div[contenteditable='plaintext-only'][role='textbox'], div[contenteditable='true'], div[contenteditable='plaintext-only']"
    );
    return div;
  }
  function getSendButton() {
    const btn = document.querySelector("button[type='submit']") || document.querySelector("button[aria-label*='Send']") || document.querySelector("button[aria-label='Send message']");
    return btn ?? null;
  }
  async function insertPromptAndSend() {
    const input = await waitFor(getInputElement, 1e4);
    const sendBtn = await waitFor(getSendButton, 1e4);
    if (!input) {
      chrome.runtime.sendMessage({
        type: "SUMMARIZE_STATUS",
        status: "error",
        reason: "Unable to find chat input in Claude."
      });
      return;
    }
    if (!sendBtn) {
      chrome.runtime.sendMessage({
        type: "SUMMARIZE_STATUS",
        status: "error",
        reason: "Unable to find send button in Claude (composer not ready)."
      });
      return;
    }
    const assistantSelector = "[data-testid='assistant-message'], [data-role='assistant']";
    const beforeAssistantCount = document.querySelectorAll(
      assistantSelector
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
    }, 5e3);
    try {
      (enabledBtn ?? sendBtn).click();
    } catch {
    }
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "waiting_ai"
    });
    watchForSummaryResponse(beforeAssistantCount, beforeAssistantLastText);
  }
  function extractLatestAssistantMessage() {
    const messageBlocks = document.querySelectorAll("[data-testid='assistant-message'], [data-role='assistant']");
    const last = messageBlocks[messageBlocks.length - 1];
    if (!last) return null;
    return last.innerText.trim();
  }
  function watchForSummaryResponse(beforeAssistantCount, beforeAssistantLastText, timeoutMs = 6e4) {
    const container = document.body;
    const observer = new MutationObserver(() => {
      const messageBlocks = document.querySelectorAll(
        "[data-testid='assistant-message'], [data-role='assistant']"
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
      if (currentCount > beforeAssistantCount && beforeAssistantLastText && text === beforeAssistantLastText) {
        return;
      }
      observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
      chrome.runtime.sendMessage({
        type: "SUMMARY_COMPLETE",
        platform: "Claude",
        summaryText: text,
        url: window.location.href,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
    let timeoutId = window.setTimeout(() => {
      observer.disconnect();
      chrome.runtime.sendMessage({
        type: "SUMMARIZE_STATUS",
        status: "error",
        reason: "Timed out waiting for Claude to finish generating the summary."
      });
    }, timeoutMs);
    observer.observe(container, {
      childList: true,
      subtree: true
    });
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "INJECT_SUMMARY_PROMPT") {
      sendResponse({ ok: true });
      insertPromptAndSend();
      return;
    }
    sendResponse({ ok: false });
  });
})();
//# sourceMappingURL=content-claude.js.map
