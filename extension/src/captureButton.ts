type CaptureButtonOptions = {
  buttonText?: string;
  onClick: () => void | Promise<void>;
};

const CAPTURE_BTN_ID = "ai-remember-capture-btn";
const CAPTURE_BTN_SELECTOR =
  `#${CAPTURE_BTN_ID}, button[data-ai-remember-capture='true']`;

const onClickMap = new WeakMap<HTMLButtonElement, () => void | Promise<void>>();

function getCaptureButtonPosStorageKey() {
  return `aiRemember:captureBtnPos:v1:${window.location.host}`;
}

function loadCaptureButtonPosition(): { left: number; top: number } | null {
  try {
    const raw = window.localStorage.getItem(getCaptureButtonPosStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { left?: unknown; top?: unknown };
    const left = typeof parsed.left === "number" ? parsed.left : Number(parsed.left);
    const top = typeof parsed.top === "number" ? parsed.top : Number(parsed.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
    return { left, top };
  } catch {
    return null;
  }
}

function saveCaptureButtonPosition(left: number, top: number): void {
  try {
    window.localStorage.setItem(
      getCaptureButtonPosStorageKey(),
      JSON.stringify({ left, top }),
    );
  } catch {
    // Ignore storage failures (private mode, quotas, etc.)
  }
}

function readInlineCaptureButtonPosition(
  btn: HTMLButtonElement,
): { left: number; top: number } | null {
  const leftRaw = btn.style.left;
  const topRaw = btn.style.top;
  if (!leftRaw || !topRaw) return null;
  const left = Number.parseFloat(leftRaw);
  const top = Number.parseFloat(topRaw);
  if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
  return { left, top };
}

function clampCaptureButtonPosition(left: number, top: number, btn: HTMLElement) {
  const rect = btn.getBoundingClientRect();
  const maxLeft = Math.max(0, window.innerWidth - rect.width);
  const maxTop = Math.max(0, window.innerHeight - rect.height);
  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop),
  };
}

function applyCaptureButtonPosition(btn: HTMLButtonElement, left: number, top: number) {
  const clamped = clampCaptureButtonPosition(left, top, btn);
  btn.dataset.aiRememberCapturePosMode = "custom";
  btn.style.setProperty("right", "", "important");
  btn.style.setProperty("bottom", "", "important");
  btn.style.setProperty("left", `${clamped.left}px`, "important");
  btn.style.setProperty("top", `${clamped.top}px`, "important");
}

function styleFloatingCaptureButton(captureBtn: HTMLButtonElement) {
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
    "important",
  );
  captureBtn.style.setProperty("display", "inline-flex", "important");
  captureBtn.style.setProperty("align-items", "center", "important");
  captureBtn.style.setProperty("justify-content", "center", "important");
  captureBtn.style.setProperty("cursor", "grab", "important");
  captureBtn.style.setProperty("pointer-events", "auto", "important");

  // Default position unless user dragged it somewhere else.
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

function enableCaptureButtonDrag(btn: HTMLButtonElement) {
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
    true,
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

    // Switch to explicit left/top positioning before dragging.
    applyCaptureButtonPosition(btn, startLeft, startTop);

    try {
      btn.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
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

  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;

    btn.style.setProperty("cursor", "grab", "important");

    const pos = readInlineCaptureButtonPosition(btn);
    if (pos) saveCaptureButtonPosition(pos.left, pos.top);

    try {
      btn.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    e.preventDefault();
  };

  btn.addEventListener("pointerup", endDrag);
  btn.addEventListener("pointercancel", endDrag);
}

function attachCaptureButtonClickHandler(btn: HTMLButtonElement) {
  if (btn.dataset.aiRememberCaptureClickBound === "true") return;
  btn.dataset.aiRememberCaptureClickBound = "true";

  btn.addEventListener("click", (e) => {
    // If drag suppressor fired, it will have already stopped propagation.
    const handler = onClickMap.get(btn);
    if (!handler) return;
    try {
      const r = handler();
      if (r && typeof (r as Promise<void>).then === "function") {
        void (r as Promise<void>);
      }
    } catch {
      // Let the caller handle its own error UI.
    }
    e.preventDefault();
  });
}

function getOrCreateCaptureButton(opts: CaptureButtonOptions): HTMLButtonElement {
  const nodes = Array.from(document.querySelectorAll(CAPTURE_BTN_SELECTOR));
  const existing = nodes.find((n) => n instanceof HTMLButtonElement) as
    | HTMLButtonElement
    | undefined;

  // Remove duplicates if the DOM re-mounted our element.
  const extras = nodes.filter((n) => n !== existing);
  for (const extra of extras) {
    if (extra instanceof HTMLElement) extra.remove();
  }

  const btn = existing ?? document.createElement("button");
  btn.id = CAPTURE_BTN_ID;
  btn.type = "button";
  btn.dataset.aiRememberCapture = "true";
  btn.textContent = opts.buttonText ?? "Capture";

  styleFloatingCaptureButton(btn);
  enableCaptureButtonDrag(btn);
  attachCaptureButtonClickHandler(btn);
  onClickMap.set(btn, opts.onClick);

  if (!btn.isConnected || btn.parentElement !== document.documentElement) {
    document.documentElement.appendChild(btn);
  }
  return btn;
}

export function mountFloatingCaptureButton(opts: CaptureButtonOptions): HTMLButtonElement {
  return getOrCreateCaptureButton(opts);
}

export function startFloatingCaptureButtonObserver(opts: CaptureButtonOptions) {
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

