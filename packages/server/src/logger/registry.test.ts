import { describe, test, it, expect, afterEach, beforeEach } from "bun:test";
import type { EventContext } from "./types.js";
import { createLoggerForRoom, getLoggerForRoom, closeLoggerForRoom, closeAllLoggers, _setLoggerForRoom, _clearLoggers } from "./registry.js";
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

// ── SpyLogger ─────────────────────────────────────────────────────────────────

interface LogCall {
  event: string;
  data: unknown;
  ctx?: EventContext;
}

class SpyLogger {
  calls: LogCall[] = [];
  log(event: string, data: unknown, ctx?: EventContext): void {
    this.calls.push({ event, data, ctx });
  }
  async flush(): Promise<void> {}
  async close(): Promise<void> {}
  get rejections(): number {
    return 0;
  }
}

// ── Structured logging invariant tests ────────────────────────────────────────

const ROOM_CODE = "TLOG";

describe("logger registry — spy helpers", () => {
  afterEach(() => {
    _clearLoggers();
  });

  it("getLoggerForRoom returns NullLogger for unknown room (no crash)", () => {
    const logger = getLoggerForRoom("UNKNOWN_ZZXQ");
    expect(() => {
      logger.log("player.disconnected", { playerName: "Ghost" }, { actorId: "Ghost" });
    }).not.toThrow();
  });

  it("_setLoggerForRoom injects spy and getLoggerForRoom retrieves it", () => {
    const spy = new SpyLogger();
    _setLoggerForRoom(ROOM_CODE, spy);
    const logger = getLoggerForRoom(ROOM_CODE);
    logger.log("room.created", { code: ROOM_CODE }, { actorId: "system" });
    expect(spy.calls).toHaveLength(1);
    expect(spy.calls[0].event).toBe("room.created");
  });

  it("_clearLoggers wipes registry so subsequent calls return NullLogger", () => {
    const spy = new SpyLogger();
    _setLoggerForRoom(ROOM_CODE, spy);
    _clearLoggers();
    const logger = getLoggerForRoom(ROOM_CODE);
    logger.log("test.event", {}, {});
    // NullLogger swallows calls; spy should not have received it
    expect(spy.calls).toHaveLength(0);
  });
});

describe("structured logging invariants", () => {
  let spy: SpyLogger;

  beforeEach(() => {
    spy = new SpyLogger();
    _setLoggerForRoom(ROOM_CODE, spy);
  });

  afterEach(() => {
    _clearLoggers();
  });

  // ── LOG-INV-1: room:create emits room.created ──────────────────────────────

  it("LOG-INV-1: room:create logs room.created with actorId=system", () => {
    const logger = getLoggerForRoom(ROOM_CODE);
    logger.log("room.created", { code: ROOM_CODE, gmName: "Alice" }, { actorId: "system" });

    expect(spy.calls).toHaveLength(1);
    const call = spy.calls[0];
    expect(call.event).toBe("room.created");
    expect((call.data as Record<string, unknown>).code).toBe(ROOM_CODE);
    expect((call.data as Record<string, unknown>).gmName).toBe("Alice");
    expect(call.ctx?.actorId).toBe("system");
  });

  // ── LOG-INV-2: decision:submit carries correct actorId ────────────────────

  it("LOG-INV-2: decision.individual_submitted has correct actorId and round/phase", () => {
    const logger = getLoggerForRoom(ROOM_CODE);
    logger.log(
      "decision.individual_submitted",
      { playerName: "Bob", role: "ob_cto", optionId: "option_A", timeRemainingMs: 30_000 },
      { actorId: "Bob", round: 2, phase: "decision" },
    );

    expect(spy.calls).toHaveLength(1);
    const call = spy.calls[0];
    expect(call.event).toBe("decision.individual_submitted");
    expect(call.ctx?.actorId).toBe("Bob");
    expect(call.ctx?.round).toBe(2);
    expect(call.ctx?.phase).toBe("decision");
    const data = call.data as Record<string, unknown>;
    expect(data.optionId).toBe("option_A");
    expect(data.timeRemainingMs).toBeTypeOf("number");
  });

  // ── LOG-INV-3: message:send logs metadata only ─────────────────────────────

  it("LOG-INV-3: message.sent includes contentLength but never message content", () => {
    const secretContent = "This is a secret message that must not be logged.";
    const logger = getLoggerForRoom(ROOM_CODE);
    logger.log(
      "message.sent",
      { from: "Alice", toName: null, faction: "openbrain", contentLength: secretContent.length, isTeamChat: true },
      { actorId: "Alice", round: 1, phase: "deliberation" },
    );

    expect(spy.calls).toHaveLength(1);
    const call = spy.calls[0];
    expect(call.event).toBe("message.sent");

    const serialized = JSON.stringify(call.data);
    // Content must NOT appear anywhere in the logged data
    expect(serialized).not.toContain(secretContent);
    expect(serialized).not.toContain("secret message");

    // Metadata must be logged
    const data = call.data as Record<string, unknown>;
    expect(data.contentLength).toBe(secretContent.length);
    expect(data.from).toBe("Alice");
    expect(data.isTeamChat).toBe(true);
    expect("content" in data).toBe(false);
  });

  // ── LOG-INV-4: disconnect emits player.disconnected ───────────────────────

  it("LOG-INV-4: player.disconnected logged with player info", () => {
    const logger = getLoggerForRoom(ROOM_CODE);
    logger.log(
      "player.disconnected",
      { playerName: "Carol", faction: "prometheus", role: "prom_ceo" },
      { actorId: "Carol", round: 3, phase: "intel" },
    );

    expect(spy.calls).toHaveLength(1);
    const call = spy.calls[0];
    expect(call.event).toBe("player.disconnected");
    const data = call.data as Record<string, unknown>;
    expect(data.playerName).toBe("Carol");
    expect(data.faction).toBe("prometheus");
    expect(call.ctx?.actorId).toBe("Carol");
  });

  // ── LOG-INV-5: in-game events carry round and phase context ───────────────

  it("LOG-INV-5: in-game log events include round and phase in context", () => {
    const logger = getLoggerForRoom(ROOM_CODE);
    logger.log("decision.individual_submitted", {}, { actorId: "Dave", round: 2, phase: "decision" });
    logger.log("message.sent", {}, { actorId: "Dave", round: 2, phase: "decision" });
    logger.log("player.disconnected", {}, { actorId: "Dave", round: 2, phase: "decision" });

    for (const call of spy.calls) {
      expect(call.ctx?.round).toBe(2);
      expect(call.ctx?.phase).toBe("decision");
    }
  });

  // ── Critical path: stable actorId across join → role → decision ───────────

  it("join → role select → decision produces stable actorId across all 3 events", () => {
    const logger = getLoggerForRoom(ROOM_CODE);
    const playerName = "Eve";

    logger.log("player.joined", { playerName, code: ROOM_CODE }, { actorId: playerName });
    logger.log("player.role_selected", { playerName, faction: "openbrain", role: "ob_cto" }, { actorId: playerName });
    logger.log("decision.individual_submitted", { playerName, role: "ob_cto", optionId: "opt_1", timeRemainingMs: 30_000 }, { actorId: playerName, round: 1, phase: "decision" });

    expect(spy.calls).toHaveLength(3);
    const actorIds = spy.calls.map((c) => c.ctx?.actorId);
    expect(new Set(actorIds).size).toBe(1);
    expect(actorIds[0]).toBe(playerName);
  });

  // ── Critical path: GM pause → resume paired events ────────────────────────

  it("GM pause → resume produces paired phase.paused and phase.resumed events", () => {
    const logger = getLoggerForRoom(ROOM_CODE);

    logger.log("phase.paused", { round: 2, phase: "decision", remainingMs: 50_000 }, { actorId: "gm", round: 2, phase: "decision" });
    logger.log("phase.resumed", { round: 2, phase: "decision", remainingMs: 50_000 }, { actorId: "gm", round: 2, phase: "decision" });

    expect(spy.calls[0].event).toBe("phase.paused");
    expect(spy.calls[1].event).toBe("phase.resumed");
    expect(spy.calls[0].ctx?.actorId).toBe("gm");
    expect(spy.calls[1].ctx?.actorId).toBe("gm");
  });

  // ── Failure mode: unknown room returns NullLogger, no crash ───────────────

  it("getLoggerForRoom for unknown room code returns NullLogger that does not crash", () => {
    const nullLogger = getLoggerForRoom("NO_SUCH_ROOM_99");
    expect(() => {
      nullLogger.log("player.disconnected", { playerName: "Ghost" }, { actorId: "Ghost" });
    }).not.toThrow();
    // Spy for ROOM_CODE should be untouched
    expect(spy.calls).toHaveLength(0);
  });
});
