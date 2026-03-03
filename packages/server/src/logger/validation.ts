import type { GameEventEnvelope } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEnvelope(event: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof event !== "object" || event === null) {
    return { valid: false, errors: ["event must be a non-null object"] };
  }

  const e = event as Record<string, unknown>;

  if (typeof e.eventId !== "string" || e.eventId.length === 0) {
    errors.push("eventId must be a non-empty string");
  }

  if (typeof e.schemaVersion !== "number" || !Number.isInteger(e.schemaVersion) || e.schemaVersion < 1) {
    errors.push("schemaVersion must be a positive integer");
  }

  if (typeof e.sessionId !== "string" || e.sessionId.length === 0) {
    errors.push("sessionId must be a non-empty string");
  }

  if (typeof e.serverTime !== "number" || e.serverTime <= 0) {
    errors.push("serverTime must be a positive number");
  }

  if (typeof e.event !== "string" || e.event.length === 0) {
    errors.push("event must be a non-empty string");
  }

  if (e.round !== null) {
    if (typeof e.round !== "number" || !Number.isInteger(e.round) || e.round < 0) {
      errors.push("round must be null or a non-negative integer");
    }
  }

  if (e.phase !== null) {
    if (typeof e.phase !== "string" || e.phase.length === 0) {
      errors.push("phase must be null or a non-empty string");
    }
  }

  if (!("data" in e) || e.data === undefined) {
    errors.push("data must be defined (can be null but not undefined)");
  }

  return { valid: errors.length === 0, errors };
}

export function buildEnvelope(
  eventName: string,
  data: unknown,
  sessionId: string,
  ctx?: { round?: number; phase?: string; actorId?: string },
): GameEventEnvelope {
  return {
    eventId: crypto.randomUUID(),
    schemaVersion: 1,
    sessionId,
    serverTime: Date.now(),
    event: eventName,
    round: ctx?.round ?? null,
    phase: ctx?.phase ?? null,
    actorId: ctx?.actorId ?? null,
    data,
  };
}
