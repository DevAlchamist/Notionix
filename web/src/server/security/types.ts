export type ArmorIqMode = "observe" | "enforce";

export type AuditEventResult = "ok" | "denied" | "not_found" | "error" | "invalid";

export type AuditTargetType =
  | "auth"
  | "session"
  | "summary"
  | "tag"
  | "workspace"
  | "social_summary"
  | "social_comment"
  | "notification";

export type AuditEventV1 = {
  /**
   * Canonical event name, e.g.:
   * - auth.login.success
   * - summary.created
   */
  eventType: string;

  /** Caller user id (your DB id), if authenticated. */
  actorUserId?: string;

  targetType: AuditTargetType;
  targetId?: string;

  /** High-level outcome category. */
  result: AuditEventResult;

  /** When the event happened. */
  timestamp: string; // ISO string

  /** Request context for traceability. */
  request: {
    method: string;
    path: string;
    ip?: string;
    userAgent?: string;
  };

  /** Optional domain metadata (workspaceId, summaryId, visibility/share changes, etc). */
  metadata?: Record<string, unknown>;
};

export type ArmorIqEmitResult =
  | { ok: true }
  | { ok: false; reason: string; error?: unknown; mode: ArmorIqMode };

