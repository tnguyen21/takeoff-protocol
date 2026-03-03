import { describe, test, expect, afterEach, beforeEach } from "bun:test";
import { createLoggerForRoom, getLoggerForRoom, closeLoggerForRoom, closeAllLoggers } from "./registry.js";
import { GameLogger, NullLogger } from "./index.js";
import { rmSync } from "fs";

const TEST_LOG_DIR = "/tmp/takeoff-test-logs";

// Clean up test logger files after each test
afterEach(async () => {
  await closeAllLoggers();
  try {
    rmSync(TEST_LOG_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

describe("registry — INV-1: createLoggerForRoom returns GameLogger when LOG_ENABLED is true/unset", () => {
  test("returns GameLogger when LOG_ENABLED is unset", () => {
    delete process.env.LOG_ENABLED;
    const logger = createLoggerForRoom("ABCD", { logDir: TEST_LOG_DIR });
    expect(logger).toBeInstanceOf(GameLogger);
  });

  test("returns GameLogger when LOG_ENABLED=true", () => {
    process.env.LOG_ENABLED = "true";
    const logger = createLoggerForRoom("ABCE", { logDir: TEST_LOG_DIR });
    expect(logger).toBeInstanceOf(GameLogger);
  });
});

describe("registry — INV-2: createLoggerForRoom returns NullLogger when LOG_ENABLED=false", () => {
  beforeEach(() => {
    process.env.LOG_ENABLED = "false";
  });
  afterEach(() => {
    delete process.env.LOG_ENABLED;
  });

  test("returns NullLogger when LOG_ENABLED=false", () => {
    const logger = createLoggerForRoom("ABCF", { logDir: TEST_LOG_DIR });
    expect(logger).toBeInstanceOf(NullLogger);
  });
});

describe("registry — INV-3: getLoggerForRoom returns same instance", () => {
  test("returns the same logger instance for the same room code", () => {
    delete process.env.LOG_ENABLED;
    const created = createLoggerForRoom("AAAA", { logDir: TEST_LOG_DIR });
    const fetched = getLoggerForRoom("AAAA");
    expect(fetched).toBe(created);
  });
});

describe("registry — INV-4: getLoggerForRoom returns NullLogger for unknown room", () => {
  test("returns NullLogger for unknown room code (not undefined, not throw)", () => {
    const logger = getLoggerForRoom("ZZZZ");
    expect(logger).toBeInstanceOf(NullLogger);
    // Must be safe to call
    expect(() => logger.log("test.event", {})).not.toThrow();
  });
});

describe("registry — INV-5: closeLoggerForRoom removes logger from registry", () => {
  test("after close, getLoggerForRoom returns a NullLogger (fresh)", async () => {
    delete process.env.LOG_ENABLED;
    createLoggerForRoom("BBBB", { logDir: TEST_LOG_DIR });
    await closeLoggerForRoom("BBBB");
    const after = getLoggerForRoom("BBBB");
    expect(after).toBeInstanceOf(NullLogger);
  });
});

describe("registry — critical path: create room → logger exists → game ends → logger closed", () => {
  test("full lifecycle: create, log, close", async () => {
    delete process.env.LOG_ENABLED;
    const logger = createLoggerForRoom("CCCC", { logDir: TEST_LOG_DIR });
    expect(logger).toBeInstanceOf(GameLogger);

    // Logger is retrievable
    expect(getLoggerForRoom("CCCC")).toBe(logger);

    // Logging does not throw
    logger.log("room.created", { code: "CCCC" });

    // Close removes from registry
    await closeLoggerForRoom("CCCC");
    expect(getLoggerForRoom("CCCC")).toBeInstanceOf(NullLogger);
    expect(getLoggerForRoom("CCCC")).not.toBe(logger);
  });
});

describe("registry — failure modes", () => {
  test("closeLoggerForRoom for non-existent room is a no-op (no throw)", async () => {
    await expect(closeLoggerForRoom("NONE")).resolves.toBeUndefined();
  });

  test("closeAllLoggers with empty registry is a no-op (no throw)", async () => {
    await expect(closeAllLoggers()).resolves.toBeUndefined();
  });
});
