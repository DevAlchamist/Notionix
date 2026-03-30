export declare const SUMMARY_PROMPT = "Please summarize the conversation above with the following structure:\n\nTitle\nMain Topic\nKey Points\nImportant Insights\nAction Items (if any)";
export declare function getInputElement(): HTMLTextAreaElement | HTMLDivElement | null;
export declare function getSendButton(): HTMLButtonElement | null;
export declare function insertPromptAndSend(): void;
export declare function extractLatestAssistantMessage(): string | null;
export declare function watchForSummaryResponse(): void;
//# sourceMappingURL=content-chatgpt.d.ts.map