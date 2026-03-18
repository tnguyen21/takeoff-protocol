import { mkdirSync } from "fs";
import { appendFile } from "fs/promises";
import type { EventContext } from "./types.js";
import { buildEnvelope, validateEnvelope } from "./validation.js";

export { EVENT_NAMES } from "./types.js";
export { validateEnvelope } from "./validation.js";

export interface GameLoggerOptions {
  maxBufferSize?: number;
  flushIntervalMs?: number;
  logDir?: string;
}

export class GameLogger {
  private readonly path: string;
  private buffer: string[];
  private readonly maxBufferSize: number;
  private flushing: boolean;
  private flushInterval: Timer;
  private readonly sessionId: string;
  private rejectedCount: number;
  private closed: boolean;

  constructor(roomCode: string, options?: GameLoggerOptions) {
    const logDir = options?.logDir ?? "logs";
    const maxBufferSize = options?.maxBufferSize ?? 1000;
    const flushIntervalMs = options?.flushIntervalMs ?? 2000;

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    this.sessionId = `${roomCode}_${ts}`;
    this.path = `${logDir}/${this.sessionId}.jsonl`;
    this.buffer = [];
    this.maxBufferSize = maxBufferSize;
    this.flushing = false;
    this.rejectedCount = 0;
    this.closed = false;

    // Create directory synchronously so it's ready before the first flush
    mkdirSync(logDir, { recursive: true });

    this.flushInterval = setInterval(() => {
      void this.flush();
    }, flushIntervalMs);
  }

  log(event: string, data: unknown, ctx?: EventContext): void {
    if (this.closed) return;

    const envelope = buildEnvelope(event, data, this.sessionId, ctx);
    const result = validateEnvelope(envelope);
    if (!result.valid) {
      this.rejectedCount++;
      process.stderr.write(`[GameLogger] rejected invalid envelope: ${result.errors.join(", ")}\n`);
      return;
    }

    this.buffer.push(JSON.stringify(envelope));

    if (this.buffer.length >= this.maxBufferSize) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;
    this.flushing = true;
    const batch = this.buffer.splice(0);
    try {
      const content = batch.join("\n") + "\n";
      await appendFile(this.path, content, "utf8");
    } catch (error) {
      // Requeue events at front of buffer so they are not lost
      this.buffer.unshift(...batch);
      process.stderr.write(`[GameLogger] flush failed: ${error}\n`);
    } finally {
      this.flushing = false;
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.flushInterval);
    await this.flush();
  }

  get rejections(): number {
    return this.rejectedCount;
  }
}

/**
 * No-op logger for when logging is disabled.
 * All methods are safe to call and do nothing.
 */
export class NullLogger {
  log(_event: string, _data: unknown, _ctx?: EventContext): void {}
  async flush(): Promise<void> {}
  async close(): Promise<void> {}
  get rejections(): number {
    return 0;
  }
}
