import type { NextRequest } from "next/server";
import type { AuditTargetType, AuditEventResult } from "./types";
import { emitAuditEventV1 } from "./audit";

export type RiskDecision = {
  allowed: boolean;
  result?: AuditEventResult;
};

function riskHooksEnabled(): boolean {
  return (process.env.ARMORIQ_RISK_HOOKS || "").toLowerCase() === "true";
}

/**
 * Disabled-by-default risk/content hook point.
 * v1 observe-only: emits telemetry but never blocks.
 * Future v2 enforce: can return `allowed=false` and the route can reject/flag.
 */
export async function maybeRunRiskContentHook(args: {
  request: NextRequest;
  actorUserId?: string;
  targetType: AuditTargetType;
  eventType: string; // e.g. "risk.decision.summary_create"
  metadata?: Record<string, unknown>;
}): Promise<RiskDecision> {
  if (!riskHooksEnabled()) {
    return { allowed: true, result: "ok" };
  }

  // In v1 we only emit telemetry.
  await emitAuditEventV1(args.request, {
    eventType: args.eventType,
    actorUserId: args.actorUserId,
    targetType: args.targetType,
    result: "ok",
    metadata: args.metadata,
  }).catch(() => {
    // Risk telemetry must never block user flows.
  });

  return { allowed: true, result: "ok" };
}

