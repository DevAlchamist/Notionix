export type ContinueAgentId = "chatgpt" | "claude" | "gemini" | "copilot" | "grok";

export type ContinueAgentLink = {
  id: ContinueAgentId;
  name: string;
  href: string;
  supportsDirectPrefill: boolean;
};

export function buildContinuationPrompt(title: string, summaryText: string): string {
  return [
    "Use this summary as context and continue the conversation from it.",
    "",
    `Title: ${title}`,
    "",
    "Summary:",
    String(summaryText ?? "").trim(),
  ].join("\n");
}

export function buildContinueAgentLinks(prompt: string): ContinueAgentLink[] {
  const encodedPrompt = encodeURIComponent(prompt);
  const continuationParam = `air_continue=${encodedPrompt}`;
  return [
    {
      id: "chatgpt",
      name: "ChatGPT",
      href: `https://chatgpt.com/?q=${encodedPrompt}`,
      supportsDirectPrefill: true,
    },
    {
      id: "claude",
      name: "Claude",
      href: `https://claude.ai/new?${continuationParam}`,
      supportsDirectPrefill: true,
    },
    {
      id: "gemini",
      name: "Gemini",
      href: `https://gemini.google.com/app?${continuationParam}`,
      supportsDirectPrefill: true,
    },
    {
      id: "copilot",
      name: "Bing Copilot",
      href: `https://copilot.microsoft.com/?${continuationParam}`,
      supportsDirectPrefill: true,
    },
    {
      id: "grok",
      name: "Grok",
      href: `https://grok.com/?q=${encodedPrompt}`,
      supportsDirectPrefill: true,
    },
  ];
}
