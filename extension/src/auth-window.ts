import { runExtensionGoogleOAuth } from "./googleAuth.js";

const statusEl = document.getElementById("status");

function setLine(text: string, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

async function main() {
  try {
    setLine("Opening Google. Sign in in the window that appears next.");
    const result = await runExtensionGoogleOAuth();
    await chrome.storage.sync.set({
      authToken: result.token,
      user: result.user,
    });
    setLine("Signed in successfully. You can close this window.");
    setTimeout(() => {
      window.close();
    }, 900);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    setLine(msg || "Sign-in failed.", true);
  }
}

void main();
