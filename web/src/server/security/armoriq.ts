import { ArmorIQClient } from "@armoriq/sdk";
import type { ArmorIqEmitResult, ArmorIqMode, AuditEventV1 } from "./types";
import { ArmorIqAuditLog } from "@/server/models/ArmorIqAuditLog";

const clientCache = new Map<string, ArmorIQClient>();

function readEnv(): {
  enabled: boolean;
  mode: ArmorIqMode;
  apiKey?: string;
  agentId?: string;
  contextId: string;
  auditMcp: string;
  auditAction: string;
  auditLlm: string;
  auditTokenTtlSeconds: number;
} {
  const enabled = (process.env.ARMORIQ_ENABLED || "").toLowerCase() === "true";
  const mode = (process.env.ARMORIQ_MODE || "observe").toLowerCase() === "enforce" ? "enforce" : "observe";

  const apiKey = (process.env.ARMORIQ_API_KEY || "").trim() || undefined;
  const agentId = (process.env.ARMORIQ_AGENT_ID || "").trim() || undefined;
  const contextId = (process.env.ARMORIQ_CONTEXT_ID || "default").trim();

  // The plan capture + invoke step names must match your onboarded MCP registry.
  // Provide overrides so you can adjust without code changes.
  const auditMcp = (process.env.ARMORIQ_AUDIT_MCP || "audit-mcp").trim();
  const auditAction = (process.env.ARMORIQ_AUDIT_ACTION || "emit_event").trim();
  const auditLlm = (process.env.ARMORIQ_AUDIT_LLM || "gpt-4").trim();
  const auditTokenTtlSecondsRaw = Number(process.env.ARMORIQ_AUDIT_TOKEN_TTL_SECONDS || "300");
  const auditTokenTtlSeconds = Number.isFinite(auditTokenTtlSecondsRaw) ? auditTokenTtlSecondsRaw : 300;

  return { enabled, mode, apiKey, agentId, contextId, auditMcp, auditAction, auditLlm, auditTokenTtlSeconds };
}

function getClientForUser(userId: string, env: ReturnType<typeof readEnv>): ArmorIQClient | null {
  if (!env.enabled) return null;
  if (!env.apiKey) {
    console.warn("[armoriq] ARMORIQ_ENABLED=true but ARMORIQ_API_KEY is missing. Skipping.");
    return null;
  }
  if (!env.agentId) {
    console.warn("[armoriq] ARMORIQ_ENABLED=true but ARMORIQ_AGENT_ID is missing. Skipping.");
    return null;
  }

  const cacheKey = `${env.agentId}|${env.contextId}|${userId}`;
  const existing = clientCache.get(cacheKey);
  if (existing) return existing;

  const next = new ArmorIQClient({
    apiKey: env.apiKey,
    userId,
    agentId: env.agentId,
    contextId: env.contextId,
  });
  clientCache.set(cacheKey, next);
  return next;
}

function buildAuditPlan(env: ReturnType<typeof readEnv>, event: AuditEventV1) {
  // IMPORTANT: The object used in plan.steps[*].params MUST be the same structure
  // passed to invoke(). ArmorIQ uses a CSRG path + merkle proof to verify step
  // execution; mismatched payloads can trip verification.
  const invokeParams = { event };

  return {
    goal: `Audit event: ${event.eventType}`,
    steps: [
      {
        action: env.auditAction,
        mcp: env.auditMcp,
        params: invokeParams,
        description: `Emit ${event.eventType}`,
      },
    ],
  };
}

async function persistArmorIqAuditAttempt(args: {
  event: AuditEventV1;
  userId: string;
  userEmail?: string;
  mode: ArmorIqMode;
  emittedOk: boolean;
  reason?: string;
}) {
  try {
    await ArmorIqAuditLog.create({
      userId: args.userId,
      userEmail: args.userEmail,
      mode: args.mode,
      emittedOk: args.emittedOk,
      reason: args.reason,
      event: args.event,
    });
  } catch (err) {
    console.warn("[armoriq] failed to persist local audit log.", err);
  }
}

export async function armorIqEmitAuditEvent(
  event: AuditEventV1,
  user: { userId: string; userEmail?: string },
): Promise<ArmorIqEmitResult> {
  const env = readEnv();
  const mode = env.mode;

  try {
    const c = getClientForUser(user.userId, env);
    if (!c) {
      await persistArmorIqAuditAttempt({
        event,
        userId: user.userId,
        userEmail: user.userEmail,
        mode,
        emittedOk: true,
        reason: "ArmorIQ disabled or not configured",
      });
      return { ok: true };
    } // observe-mode no-op if disabled/unconfigured

    const plan = buildAuditPlan(env, event);
    const prompt = `Emit audit event ${event.eventType}`;

    const captured = c.capturePlan(env.auditLlm, prompt, plan);
    const token = await c.getIntentToken(captured, undefined, env.auditTokenTtlSeconds);

    const invokeParams = { event };
    await c.invoke(env.auditMcp, env.auditAction, token, invokeParams, undefined, user.userEmail);

    await persistArmorIqAuditAttempt({
      event,
      userId: user.userId,
      userEmail: user.userEmail,
      mode,
      emittedOk: true,
    });
    return { ok: true };
  } catch (err) {
    if (mode === "enforce") {
      await persistArmorIqAuditAttempt({
        event,
        userId: user.userId,
        userEmail: user.userEmail,
        mode,
        emittedOk: false,
        reason: "ArmorIQ audit emission failed in enforce mode.",
      });
      return { ok: false, reason: "ArmorIQ audit emission failed in enforce mode.", error: err, mode };
    }
    console.warn("[armoriq] audit emission failed (observe mode).", err);
    await persistArmorIqAuditAttempt({
      event,
      userId: user.userId,
      userEmail: user.userEmail,
      mode,
      emittedOk: false,
      reason: "ArmorIQ audit emission failed (observe mode).",
    });
    return { ok: false, reason: "ArmorIQ audit emission failed (observe mode).", error: err, mode };
  }
}

