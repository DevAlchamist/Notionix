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
    const selectors = [
      "textarea[aria-label*='Message']",
      "textarea[placeholder*='Message']",
      "textarea[placeholder*='message']",
      "textarea",
      "div[contenteditable='true'][role='textbox']",
      "div[contenteditable='plaintext-only'][role='textbox']",
      "div[contenteditable='true']",
      "div[contenteditable='plaintext-only']"
    ];
    const candidates = [];
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
  function getSendButton() {
    const selectors = [
      "button[type='submit']",
      "button[aria-label*='Send']",
      "button[aria-label='Send message']"
    ];
    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel);
      for (const node of Array.from(nodes)) {
        if (isElementVisible(node)) return node;
      }
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
      if (walk.tagName === "FORM" || walk.getAttribute("role") === "form") return walk;
      walk = walk.parentElement;
    }
    return input.parentElement ?? input;
  }
  function getSendButtonForInput(input) {
    if (!input) return null;
    let walk = input;
    for (let depth = 0; depth < 12 && walk; depth++) {
      const local = walk.querySelectorAll(
        "button[type='submit'],button[aria-label*='Send'],button[aria-label='Send message']"
      );
      for (const btn of Array.from(local)) {
        if (isElementVisible(btn) && walk.contains(btn)) return btn;
      }
      walk = walk.parentElement;
    }
    return null;
  }
  function getScopedSendButtonForMount() {
    const input = getInputElement();
    if (!input) return null;
    const local = getSendButtonForInput(input);
    if (local) return local;
    const root = getComposerRootFromInput(input);
    const nearby = root.querySelectorAll(
      "button[type='submit'],button[aria-label*='Send'],button[aria-label='Send message']"
    );
    for (const btn of Array.from(nearby)) {
      if (isElementVisible(btn)) return btn;
    }
    return null;
  }
  async function insertPromptAndSend(autoSave = false) {
    const input = await waitFor(getInputElement, 1e4);
    const sendBtn = await waitFor(() => {
      const scoped = getSendButtonForInput(input);
      if (scoped) return scoped;
      const global = getSendButton();
      return global && isElementVisible(global) ? global : null;
    }, 1e4);
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
      const scoped = getSendButtonForInput(input);
      const btn = scoped ?? getSendButton();
      return btn && !btn.disabled && isElementVisible(btn) ? btn : null;
    }, 5e3);
    try {
      (enabledBtn ?? sendBtn).click();
    } catch {
    }
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "waiting_ai"
    });
    watchForSummaryResponse(beforeAssistantCount, beforeAssistantLastText, autoSave);
  }
  function mountCaptureButton() {
    const already = document.querySelector(
      "button[data-ai-remember-capture='true']"
    );
    const button = already ?? createCaptureButton();
    styleFloatingCaptureButton(button);
    if (!button.isConnected || button.parentElement !== document.documentElement) {
      document.documentElement.appendChild(button);
    }
  }
  function readContinuationPromptFromUrl() {
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
  function extractLatestAssistantMessage() {
    const messageBlocks = document.querySelectorAll("[data-testid='assistant-message'], [data-role='assistant']");
    const last = messageBlocks[messageBlocks.length - 1];
    if (!last) return null;
    return last.innerText.trim();
  }
  function watchForSummaryResponse(beforeAssistantCount, beforeAssistantLastText, autoSave, timeoutMs = 6e4) {
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
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        autoSave
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
    document.documentElement.appendChild(node);
    window.setTimeout(() => node.remove(), 3200);
  }
  function styleFloatingCaptureButton(captureBtn) {
    captureBtn.style.position = "fixed";
    captureBtn.style.right = "18px";
    captureBtn.style.bottom = "18px";
    captureBtn.style.zIndex = "2147483647";
    captureBtn.style.minWidth = "84px";
    captureBtn.style.height = "40px";
    captureBtn.style.padding = "0 14px";
    captureBtn.style.borderRadius = "9999px";
    captureBtn.style.border = "1px solid rgba(255,255,255,0.2)";
    captureBtn.style.background = "#111827";
    captureBtn.style.color = "#f9fafb";
    captureBtn.style.boxShadow = "0 10px 28px rgba(0,0,0,0.35)";
    captureBtn.style.fontSize = "13px";
    captureBtn.style.fontWeight = "600";
    captureBtn.style.lineHeight = "1";
    captureBtn.style.cursor = "pointer";
  }
  function createCaptureButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.aiRememberCapture = "true";
    btn.textContent = "Capture";
    styleFloatingCaptureButton(btn);
    btn.addEventListener("click", () => {
      insertPromptAndSend(true).catch(() => {
        showCaptureIndicator("Capture failed to start", "error");
      });
    });
    return btn;
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
//# sourceMappingURL=content-claude.js.map
