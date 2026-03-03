import { GameLogger, NullLogger } from "./index.js";
import type { GameLoggerOptions } from "./index.js";

const loggers = new Map<string, GameLogger | NullLogger>();

function isLoggingEnabled(): boolean {
  const val = process.env.LOG_ENABLED;
  // Default true: enabled unless explicitly set to "false"
  return val !== "false";
}

export function createLoggerForRoom(roomCode: string, options?: GameLoggerOptions): GameLogger | NullLogger {
  const logger: GameLogger | NullLogger = isLoggingEnabled()
    ? new GameLogger(roomCode, options)
    : new NullLogger();
  loggers.set(roomCode, logger);
  return logger;
}

export function getLoggerForRoom(roomCode: string): GameLogger | NullLogger {
  return loggers.get(roomCode) ?? new NullLogger();
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
