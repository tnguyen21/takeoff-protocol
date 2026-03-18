import type { EventContext } from "./types.js";
import { GameLogger, NullLogger } from "./index.js";
import type { GameLoggerOptions } from "./index.js";

interface LoggerLike {
  log(event: string, data: unknown, ctx?: EventContext): void;
  flush(): Promise<void>;
  close(): Promise<void>;
  readonly rejections: number;
}

const loggers = new Map<string, LoggerLike>();

function isLoggingEnabled(): boolean {
  const val = process.env.LOG_ENABLED;
  // Default true: enabled unless explicitly set to "false"
  return val !== "false";
}

export function createLoggerForRoom(code: string, options?: GameLoggerOptions): LoggerLike {
  const logger: LoggerLike = isLoggingEnabled()
    ? new GameLogger(code, options)
    : new NullLogger();
  loggers.set(code, logger);
  return logger;
}

export function getLoggerForRoom(code: string): LoggerLike {
  return loggers.get(code) ?? new NullLogger();
}

/** For testing only. Directly set a logger for a room. */
export function _setLoggerForRoom(code: string, logger: LoggerLike): void {
  loggers.set(code, logger);
}

/** For testing only. Clear all registered loggers. */
export function _clearLoggers(): void {
  loggers.clear();
}

export async function closeLoggerForRoom(roomCode: string): Promise<void> {
  const logger = loggers.get(roomCode);
  if (!logger) return;
  loggers.delete(roomCode);
  await logger.close();
}

export async function closeAllLoggers(): Promise<void> {
  const entries = [...loggers.entries()];
  loggers.clear();
  await Promise.all(entries.map(([, logger]) => logger.close()));
}
