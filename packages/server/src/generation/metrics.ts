// ── Structured generation telemetry ───────────────────────────────────────────
//
// All functions emit a single JSON line to stdout prefixed with "[generation] ".
// Format: [generation] {"event": "...", "round": N, "artifact": "...", "timestamp": "..."}
//
// No external metrics service — stdout is sufficient for V1.

function emit(payload: Record<string, unknown>): void {
  const line = JSON.stringify({ ...payload, timestamp: new Date().toISOString() });
  console.log(`[generation] ${line}`);
}

export function logGenerationStart(round: number, artifactType: string): void {
  emit({ event: "start", round, artifact: artifactType });
}

export function logGenerationSuccess(
  round: number,
  artifactType: string,
  durationMs: number,
): void {
  emit({ event: "success", round, artifact: artifactType, durationMs });
}

export function logGenerationFailure(
  round: number,
  artifactType: string,
  reason: string,
  durationMs: number,
): void {
  emit({ event: "failure", round, artifact: artifactType, reason, durationMs });
}

export function logValidationFailure(
  round: number,
  artifactType: string,
  errors: string[],
): void {
  emit({ event: "validation_failure", round, artifact: artifactType, errors });
}