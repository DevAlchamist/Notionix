"use strict";
(() => {
  // src/captureButton.ts
  var CAPTURE_BTN_ID = "ai-remember-capture-btn";
  var CAPTURE_BTN_SELECTOR = `#${CAPTURE_BTN_ID}, button[data-ai-remember-capture='true']`;
  var onClickMap = /* @__PURE__ */ new WeakMap();
  var DEFAULT_LOADING_TEXT = "Saving\u2026";
  var LOADER_STYLE_ID = "ai-remember-capture-loader-style";
  function ensureLoaderStyles() {
    if (document.getElementById(LOADER_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = LOADER_STYLE_ID;
    style.textContent = `
@keyframes aiRememberSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
    document.documentElement.appendChild(style);
  }
  function renderCaptureButtonContent(btn, text, loading) {
    while (btn.firstChild) btn.removeChild(btn.firstChild);
    const row = document.createElement("span");
    row.style.display = "inline-flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "center";
    row.style.gap = "8px";
    row.style.pointerEvents = "none";
    if (loading) {
      ensureLoaderStyles();
      const spinner = document.createElement("span");
      spinner.setAttribute("aria-hidden", "true");
      spinner.style.width = "14px";
      spinner.style.height = "14px";
      spinner.style.border = "2px solid rgba(255,255,255,0.35)";
      spinner.style.borderTopColor = "rgba(255,255,255,0.95)";
      spinner.style.borderRadius = "9999px";
      spinner.style.animation = "aiRememberSpin 0.8s linear infinite";
      row.appendChild(spinner);
    }
    const label = document.createElement("span");
    label.textContent = text;
    row.appendChild(label);
    btn.appendChild(row);
  }
  function getCaptureButtonPosStorageKey() {
    return `aiRemember:captureBtnPos:v1:${window.location.host}`;
  }
  function loadCaptureButtonPosition() {
    try {
      const raw = window.localStorage.getItem(getCaptureButtonPosStorageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const left = typeof parsed.left === "number" ? parsed.left : Number(parsed.left);
      const top = typeof parsed.top === "number" ? parsed.top : Number(parsed.top);
      if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
      return { left, top };
    } catch {
      return null;
    }
  }
  function saveCaptureButtonPosition(left, top) {
    try {
      window.localStorage.setItem(
        getCaptureButtonPosStorageKey(),
        JSON.stringify({ left, top })
      );
    } catch {
    }
  }
  function readInlineCaptureButtonPosition(btn) {
    const leftRaw = btn.style.left;
    const topRaw = btn.style.top;
    if (!leftRaw || !topRaw) return null;
    const left = Number.parseFloat(leftRaw);
    const top = Number.parseFloat(topRaw);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
    return { left, top };
  }
  function clampCaptureButtonPosition(left, top, btn) {
    const rect = btn.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);
    return {
      left: Math.min(Math.max(0, left), maxLeft),
      top: Math.min(Math.max(0, top), maxTop)
    };
  }
  function applyCaptureButtonPosition(btn, left, top) {
    const clamped = clampCaptureButtonPosition(left, top, btn);
    btn.dataset.aiRememberCapturePosMode = "custom";
    btn.style.setProperty("right", "", "important");
    btn.style.setProperty("bottom", "", "important");
    btn.style.setProperty("left", `${clamped.left}px`, "important");
    btn.style.setProperty("top", `${clamped.top}px`, "important");
  }
  function styleFloatingCaptureButton(captureBtn) {
    captureBtn.style.setProperty("all", "initial", "important");
    captureBtn.style.setProperty("position", "fixed", "important");
    captureBtn.style.setProperty("touch-action", "none", "important");
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
    captureBtn.style.setProperty(
      "font-family",
      "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
      "important"
    );
    captureBtn.style.setProperty("display", "inline-flex", "important");
    captureBtn.style.setProperty("align-items", "center", "important");
    captureBtn.style.setProperty("justify-content", "center", "important");
    captureBtn.style.setProperty("cursor", "grab", "important");
    captureBtn.style.setProperty("pointer-events", "auto", "important");
    captureBtn.style.setProperty("user-select", "none", "important");
    if (captureBtn.dataset.aiRememberCaptureLoading === "true") {
      applyCaptureButtonLoadingState(
        captureBtn,
        true,
        captureBtn.dataset.aiRememberCaptureLoadingText ?? void 0
      );
    }
    const posMode = captureBtn.dataset.aiRememberCapturePosMode;
    const saved = loadCaptureButtonPosition();
    if (posMode === "custom" || saved) {
      const next = saved ?? readInlineCaptureButtonPosition(captureBtn);
      if (next) {
        applyCaptureButtonPosition(captureBtn, next.left, next.top);
        return;
      }
    }
    captureBtn.dataset.aiRememberCapturePosMode = "default";
    captureBtn.style.setProperty("left", "", "important");
    captureBtn.style.setProperty("top", "", "important");
    captureBtn.style.setProperty("right", "18px", "important");
    captureBtn.style.setProperty("bottom", "18px", "important");
  }
  function enableCaptureButtonDrag(btn) {
    if (btn.dataset.aiRememberCaptureDraggable === "true") return;
    btn.dataset.aiRememberCaptureDraggable = "true";
    let dragging = false;
    let suppressClick = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    const thresholdPx = 4;
    btn.addEventListener(
      "click",
      (e) => {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        suppressClick = false;
      },
      true
    );
    btn.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      suppressClick = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = btn.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      btn.style.setProperty("cursor", "grabbing", "important");
      applyCaptureButtonPosition(btn, startLeft, startTop);
      try {
        btn.setPointerCapture(e.pointerId);
      } catch {
      }
      e.preventDefault();
    });
    btn.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!suppressClick && Math.hypot(dx, dy) >= thresholdPx) suppressClick = true;
      applyCaptureButtonPosition(btn, startLeft + dx, startTop + dy);
      e.preventDefault();
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      btn.style.setProperty("cursor", "grab", "important");
      const pos = readInlineCaptureButtonPosition(btn);
      if (pos) saveCaptureButtonPosition(pos.left, pos.top);
      try {
        btn.releasePointerCapture(e.pointerId);
      } catch {
      }
      e.preventDefault();
    };
    btn.addEventListener("pointerup", endDrag);
    btn.addEventListener("pointercancel", endDrag);
  }
  function attachCaptureButtonClickHandler(btn) {
    if (btn.dataset.aiRememberCaptureClickBound === "true") return;
    btn.dataset.aiRememberCaptureClickBound = "true";
    btn.addEventListener("click", (e) => {
      if (btn.disabled || btn.dataset.aiRememberCaptureLoading === "true") {
        e.preventDefault();
        return;
      }
      const handler = onClickMap.get(btn);
      if (!handler) return;
      try {
        const r = handler();
        if (r && typeof r.then === "function") {
          void r;
        }
      } catch {
      }
      e.preventDefault();
    });
  }
  function applyCaptureButtonLoadingState(btn, loading, loadingText) {
    if (loading) {
      if (!btn.dataset.aiRememberCaptureDefaultText) {
        btn.dataset.aiRememberCaptureDefaultText = btn.textContent ?? "Capture";
      }
      btn.dataset.aiRememberCaptureLoading = "true";
      btn.dataset.aiRememberCaptureLoadingText = loadingText ?? DEFAULT_LOADING_TEXT;
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn.setAttribute("aria-disabled", "true");
      btn.style.setProperty("cursor", "not-allowed", "important");
      btn.style.setProperty("opacity", "0.78", "important");
      renderCaptureButtonContent(
        btn,
        btn.dataset.aiRememberCaptureLoadingText ?? DEFAULT_LOADING_TEXT,
        true
      );
      return;
    }
    btn.dataset.aiRememberCaptureLoading = "false";
    delete btn.dataset.aiRememberCaptureLoadingText;
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    btn.removeAttribute("aria-disabled");
    btn.style.setProperty("cursor", "grab", "important");
    btn.style.setProperty("opacity", "1", "important");
    const fallback = btn.dataset.aiRememberCaptureDefaultText ?? "Capture";
    renderCaptureButtonContent(btn, fallback, false);
  }
  function getOrCreateCaptureButton(opts) {
    const nodes = Array.from(document.querySelectorAll(CAPTURE_BTN_SELECTOR));
    const existing = nodes.find((n) => n instanceof HTMLButtonElement);
    const extras = nodes.filter((n) => n !== existing);
    for (const extra of extras) {
      if (extra instanceof HTMLElement) extra.remove();
    }
    const btn = existing ?? document.createElement("button");
    btn.id = CAPTURE_BTN_ID;
    btn.type = "button";
    btn.dataset.aiRememberCapture = "true";
    const label = opts.buttonText ?? "Capture";
    btn.dataset.aiRememberCaptureDefaultText = label;
    renderCaptureButtonContent(btn, label, false);
    styleFloatingCaptureButton(btn);
    enableCaptureButtonDrag(btn);
    attachCaptureButtonClickHandler(btn);
    onClickMap.set(btn, opts.onClick);
    if (!btn.isConnected || btn.parentElement !== document.documentElement) {
      document.documentElement.appendChild(btn);
    }
    return btn;
  }
  function mountFloatingCaptureButton(opts) {
    return getOrCreateCaptureButton(opts);
  }
  function setFloatingCaptureButtonLoading(loading, loadingText) {
    const btn = document.getElementById(CAPTURE_BTN_ID);
    if (!(btn instanceof HTMLButtonElement)) return;
    applyCaptureButtonLoadingState(btn, loading, loadingText);
  }
  function startFloatingCaptureButtonObserver(opts) {
    mountFloatingCaptureButton(opts);
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        mountFloatingCaptureButton(opts);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", () => {
      const btn = document.getElementById(CAPTURE_BTN_ID);
      if (!(btn instanceof HTMLButtonElement)) return;
      const pos = readInlineCaptureButtonPosition(btn);
      if (!pos) return;
      applyCaptureButtonPosition(btn, pos.left, pos.top);
    });
  }

  // src/content-bing.ts
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
  function isElementVisible(el) {
    if (!el.isConnected) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (el.offsetParent === null && style.position !== "fixed") return false;
    return true;
  }
  function getInputElement() {
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
      "button[aria-label*='send']",
      "button[aria-label*='Submit']",
      "button[aria-label*='submit']",
      "[role='button'][aria-label*='Send']",
      "[role='button'][aria-label*='send']"
    ];
    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel);
      for (const node of Array.from(nodes)) {
        if (node instanceof HTMLButtonElement && isElementVisible(node)) return node;
      }
    }
    return null;
  }
  async function insertPromptAndSend(autoSave = false) {
    const input = await waitFor(getInputElement, 15e3);
    const sendBtn = await waitFor(() => {
      const b = getSendButton();
      return b && isElementVisible(b) ? b : null;
    }, 15e3);
    if (!input) {
      chrome.runtime.sendMessage({
        type: "SUMMARIZE_STATUS",
        status: "error",
        reason: "Unable to find chat input in Bing/Copilot."
      });
      return;
    }
    if (!sendBtn) {
      chrome.runtime.sendMessage({
        type: "SUMMARIZE_STATUS",
        status: "error",
        reason: "Unable to find send button in Bing/Copilot (composer not ready)."
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
    }
    chrome.runtime.sendMessage({
      type: "SUMMARIZE_STATUS",
      status: "waiting_ai"
    });
    watchForSummaryResponse(beforeAssistantLastText, autoSave);
  }
  function extractLatestAssistantMessage() {
    const selectors = [
      // Copilot / Bing variants (best-effort; UI changes often)
      "cib-message-group cib-message",
      "cib-message",
      "[data-testid*='assistant']",
      "[data-role='assistant']",
      "[data-author='assistant']",
      "[data-author='bot']"
    ];
    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel);
      const last = nodes[nodes.length - 1];
      const txt = last?.innerText?.trim();
      if (txt) return txt;
    }
    return null;
  }
  function watchForSummaryResponse(beforeAssistantLastText, autoSave, timeoutMs = 7e4) {
    const container = document.body;
    const quietPeriodMs = 3e3;
    let timeoutId;
    let quietTimerId;
    let lastSeenText = null;
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
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        autoSave
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
        reason: "Timed out waiting for Bing/Copilot to finish generating the summary (waiting for stable output)."
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
        setFloatingCaptureButtonLoading(true, "Working\u2026");
        insertPromptAndSend(true).catch(() => {
          chrome.runtime.sendMessage({
            type: "SUMMARIZE_STATUS",
            status: "error",
            reason: "Could not start capture on this page."
          });
          showCaptureIndicator("Capture failed to start", "error");
          setFloatingCaptureButtonLoading(false);
        });
      }
    });
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
      const reason = typeof message?.reason === "string" && message.reason.trim().length ? message.reason.trim() : "Capture could not be saved.";
      showCaptureIndicator(reason, "error");
      setFloatingCaptureButtonLoading(false);
      return;
    }
    sendResponse({ ok: false });
  });
  startCaptureButtonObserver();
})();
//# sourceMappingURL=content-bing.js.map
