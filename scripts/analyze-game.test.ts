import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { parseLines, generateSummary } from "./analyze-game.js";

const FIXTURE_PATH = join(import.meta.dir, "fixtures", "sample-game.jsonl");

// ── INV-1: Script produces output for a valid JSONL fixture ───────────────────

describe("parseLines", () => {
  it("INV-1: parses all valid lines from the fixture file", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events, malformed } = parseLines(content);
    expect(events.length).toBeGreaterThan(0);
    expect(malformed).toBe(0);
    // All parsed objects should have the required envelope fields
    for (const ev of events) {
      expect(typeof ev.eventId).toBe("string");
      expect(typeof ev.sessionId).toBe("string");
      expect(typeof ev.serverTime).toBe("number");
      expect(typeof ev.event).toBe("string");
    }
  });

  // INV-2: Malformed lines are skipped with a warning, not a crash
  it("INV-2: skips malformed lines without crashing", () => {
    const content = [
      '{"eventId":"e1","schemaVersion":1,"sessionId":"S1","serverTime":1000,"event":"room.created","round":null,"phase":null,"actorId":"system","data":{}}',
      "NOT VALID JSON {{{",
      '{"eventId":"e2","schemaVersion":1,"sessionId":"S1","serverTime":2000,"event":"game.started","round":null,"phase":null,"actorId":"system","data":{"players":[]}}',
      "also bad",
    ].join("\n");

    const { events, malformed } = parseLines(content);
    expect(events).toHaveLength(2);
    expect(malformed).toBe(2);
  });

  // INV-3: Empty file produces no events
  it("INV-3: empty string yields zero events and zero malformed", () => {
    const { events, malformed } = parseLines("");
    expect(events).toHaveLength(0);
    expect(malformed).toBe(0);
  });

  it("blank-only content yields zero events", () => {
    const { events } = parseLines("   \n  \n  ");
    expect(events).toHaveLength(0);
  });
});

// ── generateSummary ───────────────────────────────────────────────────────────

describe("generateSummary", () => {
  // INV-3: Empty events → "No events found."
  it("INV-3: empty events returns 'No events found.'", () => {
    expect(generateSummary([])).toBe("No events found.");
  });

  // INV-4: All 6 sections present when events cover all types
  it("INV-4: output contains all 6 section headers when full fixture is used", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("=== Session Metadata ===");
    expect(summary).toContain("=== Decision Stats ===");
    expect(summary).toContain("=== Activity Stats ===");
    expect(summary).toContain("=== Communication Stats ===");
    expect(summary).toContain("=== State Trajectory ===");
    expect(summary).toContain("=== Trigger Report ===");
  });

  // Critical path 1: full fixture produces meaningful data in each section
  it("produces session metadata from fixture", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("ABC1");         // room code
    expect(summary).toContain("ABC1_2024");    // session id prefix
    expect(summary).toMatch(/Rounds:\s+[1-9]/); // at least 1 round
  });

  it("includes player roster from game.started event", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("Alice");
    expect(summary).toContain("openbrain");
    expect(summary).toContain("ob_cto");
  });

  it("shows phase timing breakdown from phase.changed events", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("Phase timing breakdown");
    // intel phase had 180s duration
    expect(summary).toMatch(/intel\s*:\s*3m/);
  });

  it("includes individual and team decisions", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("accelerate_compute");
    expect(summary).toContain("deploy_flagship");
    expect(summary).toContain("openbrain");
  });

  it("includes inaction events", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("Inactions");
    expect(summary).toContain("china");
  });

  it("shows activity stats with apps and penalty", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("wandb");
    expect(summary).toContain("Missed primary app penalties");
    expect(summary).toContain("Carol");
  });

  it("shows communication stats with NPC message", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("NPC messages");
    expect(summary).toContain("Senator Chen");
    expect(summary).toContain("Average message length");
  });

  it("shows state trajectory with deltas and GM override", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("State snapshots");
    expect(summary).toContain("State deltas per round");
    expect(summary).toContain("obCapability");
    expect(summary).toContain("GM overrides");
    expect(summary).toContain("publicSentiment");
  });

  it("shows threshold and NPC trigger events", () => {
    const content = readFileSync(FIXTURE_PATH, "utf8");
    const { events } = parseLines(content);
    const summary = generateSummary(events);

    expect(summary).toContain("prom_alignment_breakthrough");
    expect(summary).toContain("senator_policy_hearing");
    expect(summary).toContain("AI Race Accelerates");
  });

  // Critical path 2: phase-only events → metadata + timing, other sections say "none"
  it("phase-only events: other sections show 'No ... recorded'", () => {
    const phaseOnlyEvents = [
      {
        eventId: "e1",
        schemaVersion: 1,
        sessionId: "TEST_2024",
        serverTime: 1000000,
        event: "room.created",
        round: null,
        phase: null,
        actorId: "system",
        data: { code: "TEST" },
      },
      {
        eventId: "e2",
        schemaVersion: 1,
        sessionId: "TEST_2024",
        serverTime: 1060000,
        event: "phase.changed",
        round: 1,
        phase: "briefing",
        actorId: "system",
        data: { from: "lobby", to: "briefing", round: 1, durationMs: 0 },
      },
      {
        eventId: "e3",
        schemaVersion: 1,
        sessionId: "TEST_2024",
        serverTime: 1180000,
        event: "phase.changed",
        round: 1,
        phase: "intel",
        actorId: "system",
        data: { from: "briefing", to: "intel", round: 1, durationMs: 120000 },
      },
    ];

    const summary = generateSummary(phaseOnlyEvents as never);

    expect(summary).toContain("=== Session Metadata ===");
    expect(summary).toContain("Phase timing breakdown");
    expect(summary).toContain("briefing"); // briefing→intel event records briefing duration
    expect(summary).toContain("Player roster: No game.started event found.");

    expect(summary).toContain("No decisions recorded.");
    expect(summary).toContain("No activity data recorded.");
    expect(summary).toContain("No messages recorded.");
    expect(summary).toContain("No state events recorded.");
    expect(summary).toContain("No triggers or publishing events recorded.");
  });

  // Detects leader override when locked choice differs from majority vote
  it("detects leader override when locked choice differs from vote majority", () => {
    const baseEnv = {
      schemaVersion: 1,
      sessionId: "OVR",
      phase: "decision",
      round: 1,
      actorId: "system",
    };
    const events = [
      // 2 votes for "option_a", 1 vote for "option_b"
      { ...baseEnv, eventId: "v1", serverTime: 1000, event: "decision.team_vote", data: { playerName: "P1", faction: "openbrain", optionId: "option_a" } },
      { ...baseEnv, eventId: "v2", serverTime: 1001, event: "decision.team_vote", data: { playerName: "P2", faction: "openbrain", optionId: "option_a" } },
      { ...baseEnv, eventId: "v3", serverTime: 1002, event: "decision.team_vote", data: { playerName: "P3", faction: "openbrain", optionId: "option_b" } },
      // Leader locks option_b (overriding majority)
      { ...baseEnv, eventId: "l1", serverTime: 1003, event: "decision.team_locked", data: { faction: "openbrain", optionId: "option_b", leaderName: "P3" } },
    ];

    const summary = generateSummary(events as never);
    expect(summary).toContain("leader override");
    expect(summary).toContain("option_a");
  });

  it("no override warning when locked choice matches vote majority", () => {
    const baseEnv = {
      schemaVersion: 1,
      sessionId: "NOV",
      phase: "decision",
      round: 1,
      actorId: "system",
    };
    const events = [
      { ...baseEnv, eventId: "v1", serverTime: 1000, event: "decision.team_vote", data: { playerName: "P1", faction: "openbrain", optionId: "option_a" } },
      { ...baseEnv, eventId: "l1", serverTime: 1001, event: "decision.team_locked", data: { faction: "openbrain", optionId: "option_a", leaderName: "P1" } },
    ];

    const summary = generateSummary(events as never);
    expect(summary).not.toContain("leader override");
  });
});
