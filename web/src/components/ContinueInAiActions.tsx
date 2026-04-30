"use client";

import type { ContinueAgentLink } from "@/lib/agentRedirect";
import { useState } from "react";

type Props = {
  prompt: string;
  links: ContinueAgentLink[];
};

export function ContinueInAiActions({ prompt, links }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const hasFallbackAgents = links.some((agent) => !agent.supportsDirectPrefill);

  async function handleFallbackOpen(href: string, agentName: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus(`Opened ${agentName}. Prompt copied to clipboard - paste it into the chat box.`);
    } catch {
      setStatus(`Opened ${agentName}. Clipboard copy failed - copy manually and paste into the chat box.`);
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {links.map((agent) =>
        agent.supportsDirectPrefill ? (
          <a
            key={agent.id}
            href={agent.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-[#4B5CC4] hover:bg-slate-100"
          >
            <span>{agent.name}</span>
            <span aria-hidden>↗</span>
          </a>
        ) : (
          <button
            key={agent.id}
            type="button"
            onClick={() => void handleFallbackOpen(agent.href, agent.name)}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-[#4B5CC4] hover:bg-slate-100"
          >
            <span>{agent.name}</span>
            <span aria-hidden>↗</span>
          </button>
        ),
      )}
      {hasFallbackAgents ? (
        <p className="pt-1 text-[11px] text-slate-500">
          Claude, Gemini, and Bing Copilot open with clipboard fallback. Paste the prompt into the input after opening.
        </p>
      ) : null}
      {status ? <p className="text-[11px] font-medium text-slate-600">{status}</p> : null}
    </div>
  );
}
