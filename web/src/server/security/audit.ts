import type { NextRequest } from "next/server";
import {
  getRequestContext,
  getUserEmailFromRequest,
  getUserIdFromRequest,
} from "@/server/auth/request";
import { armorIqEmitAuditEvent } from "./armoriq";
import type { AuditEventResult, AuditEventV1, AuditTargetType } from "./types";

export type BuildAuditEventArgsV1 = {
  eventType: string;
  actorUserId?: string;
  targetType: AuditTargetType;
  targetId?: string;
  result: AuditEventResult;
  timestamp?: string; // defaults to now
  metadata?: Record<string, unknown>;
  request: ReturnType<typeof getRequestContext>;
};

export function buildAuditEventV1(args: BuildAuditEventArgsV1): AuditEventV1 {
  return {
    eventType: args.eventType,
    actorUserId: args.actorUserId,
    targetType: args.targetType,
    targetId: args.targetId,
    result: args.result,
    timestamp: args.timestamp ?? new Date().toISOString(),
    request: args.request,
    metadata: args.metadata,
  };
}

export async function emitAuditEventV1(
  request: NextRequest,
  args: {
    eventType: string;
    targetType: AuditTargetType;
    targetId?: string;
    result: AuditEventResult;
    metadata?: Record<string, unknown>;
    actorUserId?: string;
  },
): Promise<void> {
  const actorUserId = args.actorUserId ?? getUserIdFromRequest(request);
  if (!actorUserId) return; // unauthenticated => skip audit emission

  const userEmail = await getUserEmailFromRequest(request).catch(() => undefined);
  const event = buildAuditEventV1({
    eventType: args.eventType,
    actorUserId,
    targetType: args.targetType,
    targetId: args.targetId,
    result: args.result,
    metadata: args.metadata,
    request: getRequestContext(request),
  });

  const emission = await armorIqEmitAuditEvent(event, {
    userId: actorUserId,
    userEmail: userEmail ?? undefined,
  });
  if (!emission.ok && emission.mode === "enforce") {
    // In v1 observe mode, armorIqEmitAuditEvent should not break requests.
    throw new Error(emission.reason);
  }
}

