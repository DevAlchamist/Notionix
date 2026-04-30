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
    const candidates = [];
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
  function isElementVisible(el) {
    if (!el.isConnected) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (el.offsetParent === null && style.position !== "fixed") return false;
    return true;
  }
  function getComposerRootFromInput(input) {
    let walk = input;
    for (let d = 0; d < 10 && walk; d++) {
      const role = walk.getAttribute("role");
      if (walk.tagName === "FORM" || role === "form" || walk.hasAttribute("data-testid") || walk.getAttribute("aria-label")?.toLowerCase().includes("message")) {
        return walk;
      }
      walk = walk.parentElement;
    }
    return input.parentElement ?? input;
  }
  function findSendControlInRoot(root) {
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
      "button[type='submit']"
    ];
    for (const sel of selectors) {
      const nodes = root.querySelectorAll(sel);
      for (const node of Array.from(nodes)) {
        if (isElementVisible(node)) return node;
      }
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
      const composerRoot = getComposerRootFromInput(composerInput);
      const near = findSendControlInRoot(composerRoot) ?? findSendControlNearInput(composerInput);
      if (near) return near;
    }
    for (const sel of globalSelectors) {
      const all = document.querySelectorAll(sel);
      for (const el of Array.from(all)) {
        if (isElementVisible(el)) return el;
      }
    }
    return null;
  }
  function getScopedSendControlForMount() {
    const input = getInputElement();
    if (!input) return null;
    const composerRoot = getComposerRootFromInput(input);
    return findSendControlInRoot(composerRoot) ?? findSendControlNearInput(input);
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
  async function insertPromptAndSend(autoSave = false) {
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
      beforeAssistantLastText,
      autoSave
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
  function watchForSummaryResponse(beforeAssistantCount, beforeAssistantLastText, autoSave, timeoutMs = 6e4) {
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
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        autoSave
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
  function showCaptureIndicator(message, tone = "success") {
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
  function styleFloatingCaptureButton(captureBtn) {
    captureBtn.style.setProperty("all", "initial", "important");
    captureBtn.style.setProperty("position", "fixed", "important");
    captureBtn.style.setProperty("right", "18px", "important");
    captureBtn.style.setProperty("bottom", "18px", "important");
    captureBtn.style.setProperty("z-index", "2147483647", "important");
    captureBtn.style.setProperty("min-width", "84px", "important");
    captureBtn.style.setProperty("height", "40px", "important");
    captureBtn.style.setProperty("padding", "0 14px", "important");
    captureBtn.style.setProperty("border-radius", "9999px", "important");
    captureBtn.style.setProperty("border", "1px solid rgba(255,255,255,0.2)", "important");
    captureBtn.style.setProperty("background", "#111827", "important");
    captureBtn.style.setProperty("color", "#f9fafb", "important");
    captureBtn.style.setProperty("box-shadow", "0 10px 28px rgba(0,0,0,0.35)", "important");
    captureBtn.style.setProperty("font-size", "13px", "important");
    captureBtn.style.setProperty("font-weight", "600", "important");
    captureBtn.style.setProperty("line-height", "1", "important");
    captureBtn.style.setProperty("font-family", "Inter, system-ui, -apple-system, Segoe UI, sans-serif", "important");
    captureBtn.style.setProperty("display", "inline-flex", "important");
    captureBtn.style.setProperty("align-items", "center", "important");
    captureBtn.style.setProperty("justify-content", "center", "important");
    captureBtn.style.setProperty("cursor", "pointer", "important");
    captureBtn.style.setProperty("pointer-events", "auto", "important");
  }
  function createCaptureButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.aiRememberCapture = "true";
    btn.textContent = "Capture";
    styleFloatingCaptureButton(btn);
    btn.addEventListener("click", () => {
      insertPromptAndSend(true).catch(() => {
        chrome.runtime.sendMessage({
          type: "SUMMARIZE_STATUS",
          status: "error",
          reason: "Could not start capture on this page."
        });
        showCaptureIndicator("Capture failed to start", "error");
      });
    });
    return btn;
  }
  function mountCaptureButton() {
    const existing = document.querySelector(
      "button[data-ai-remember-capture='true']"
    );
    const button = existing ?? createCaptureButton();
    styleFloatingCaptureButton(button);
    if (!button.isConnected || button.parentElement !== document.documentElement) {
      document.documentElement.appendChild(button);
    }
  }
  function readContinuationPromptFromUrl() {
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
  async function prefillContinuationPromptFromUrl() {
    const prompt = readContinuationPromptFromUrl();
    if (!prompt) return;
    const input = await waitFor(getInputElement, 15e3);
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
  async function insertContinuePromptIntoInput(prompt) {
    const trimmed = String(prompt ?? "").trim();
    if (!trimmed)
      return;
    const input = await waitFor(getInputElement, 15e3);
    if (!input)
      throw new Error("Unable to find chat input.");
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
  function startCaptureButtonObserver() {
    mountCaptureButton();
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        mountCaptureButton();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "INJECT_SUMMARY_PROMPT") {
      sendResponse({ ok: true });
      insertPromptAndSend(Boolean(message?.autoSave));
      return;
    }
    if (message.type === "INJECT_CONTINUE_PROMPT") {
      insertContinuePromptIntoInput(String(message?.prompt ?? "")).then(() => {
        sendResponse({ ok: true });
      }).catch((err) => {
        sendResponse({ ok: false, reason: String(err?.message ?? err) });
      });
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
      const reason = typeof message?.reason === "string" && message.reason.trim().length ? message.reason.trim() : "Capture could not be saved.";
      showCaptureIndicator(reason, "error");
      return;
    }
    sendResponse({ ok: false });
  });
  startCaptureButtonObserver();
  void prefillContinuationPromptFromUrl();
})();
//# sourceMappingURL=content-chatgpt.js.map
