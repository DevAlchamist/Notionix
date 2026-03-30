"use strict";
(() => {
  // src/content-chatgpt.ts
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
      "div[contenteditable='true']"
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el instanceof HTMLTextAreaElement) return el;
      if (el instanceof HTMLDivElement) return el;
    }
    return null;
  }
  function isSendControlEnabled(el) {
    if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) {
      return !el.disabled && el.getAttribute("aria-disabled") !== "true";
    }
    if (el.getAttribute("aria-disabled") === "true") return false;
    if (el.hasAttribute("disabled")) return false;
    return true;
  }
  function findSendControlNearInput(composerInput) {
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
      "button[type='submit']"
    ];
    let walk = composerInput;
    for (let d = 0; d < 28 && walk; d++) {
      for (const sel of selectors) {
        const hit = walk.querySelector(sel);
        if (hit instanceof HTMLElement) return hit;
      }
      walk = walk.parentElement;
    }
    return null;
  }
  function getSendControl(composerInput) {
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
      "button[type='submit']"
    ];
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
  function trySubmitViaKeyboard(composerInput) {
    const base = {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    };
    composerInput.dispatchEvent(new KeyboardEvent("keydown", base));
    composerInput.dispatchEvent(
      new KeyboardEvent("keyup", { ...base })
    );
    const isMac = /Mac|iPhone|iPod|iPad/i.test(
      typeof navigator !== "undefined" ? navigator.platform : ""
    );
    composerInput.dispatchEvent(
      new KeyboardEvent("keydown", {
        ...base,
        ...isMac ? { metaKey: true } : { ctrlKey: true }
      })
    );
  }
  async function insertPromptAndSend() {
    const input = await waitFor(getInputElement, 1e4);
    if (!input) {
      chrome.runtime.sendMessage({
        type: "SUMMARIZE_STATUS",
        status: "error",
        reason: "Unable to find chat input in ChatGPT."
      });
      return;
    }
    const assistantSelector = "[data-message-author-role='assistant']";
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
    const enabledSendControl = await waitFor(() => {
      const control = getSendControl(input);
      return control && isSendControlEnabled(control) ? control : null;
    }, 5e3);
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
      status: "waiting_ai"
    });
    watchForSummaryResponse(
      beforeAssistantCount,
      beforeAssistantLastText
    );
  }
  function extractLatestAssistantMessage() {
    const messageBlocks = document.querySelectorAll(
      "[data-message-author-role='assistant']"
    );
    const last = messageBlocks[messageBlocks.length - 1];
    if (!last) return null;
    return last.innerText.trim();
  }
  function watchForSummaryResponse(beforeAssistantCount, beforeAssistantLastText, timeoutMs = 6e4) {
    const assistantSelector = "[data-message-author-role='assistant']";
    const container = document.body;
    const quietPeriodMs = 3e3;
    let timeoutId;
    let quietTimerId;
    let newMessageStarted = false;
    let lastSeenText = null;
    const accept = () => {
      const messageBlocks = document.querySelectorAll(assistantSelector);
      const last = messageBlocks[messageBlocks.length - 1];
      const latestText = last?.innerText?.trim() ?? "";
      if (!latestText) return;
      if (lastSeenText && latestText !== lastSeenText) return;
      observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
      chrome.runtime.sendMessage({
        type: "SUMMARY_COMPLETE",
        platform: "ChatGPT",
        summaryText: latestText,
        url: window.location.href,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    };
    const observer = new MutationObserver(() => {
      const messageBlocks = document.querySelectorAll(assistantSelector);
      const currentCount = messageBlocks.length;
      const last = messageBlocks[messageBlocks.length - 1];
      if (!last) return;
      const text = last.innerText.trim();
      if (!text) return;
      if (currentCount < beforeAssistantCount) return;
      if (!newMessageStarted) {
        if (currentCount === beforeAssistantCount) {
          if (beforeAssistantLastText && text === beforeAssistantLastText) return;
        } else if (beforeAssistantLastText && currentCount > beforeAssistantCount && text === beforeAssistantLastText) {
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
    timeoutId = window.setTimeout(() => {
      observer.disconnect();
      if (quietTimerId) window.clearTimeout(quietTimerId);
      chrome.runtime.sendMessage({
        type: "SUMMARIZE_STATUS",
        status: "error",
        reason: "Timed out waiting for ChatGPT to finish generating the summary (waiting for stable output)."
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
//# sourceMappingURL=content-chatgpt.js.map
