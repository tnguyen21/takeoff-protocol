#!/usr/bin/env bun
/**
 * Headless full-game runner with real LLM generation.
 *
 * Creates a room with 16 bot players, runs all 5 rounds with real Anthropic
 * API generation (briefings, content, decisions, NPC messages), and writes
 * a comprehensive JSON file with all generated artifacts for review.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... bun scripts/run-full-game.ts
 *   ANTHROPIC_API_KEY=sk-... bun scripts/run-full-game.ts -o output/my-game.json
 *   ANTHROPIC_API_KEY=sk-... bun scripts/run-full-game.ts --seed 42
 *
 * Output: JSON file at output/game-{timestamp}.json (or custom -o path)
 * View:   open scripts/view-game.html in a browser, load the JSON file.
 */

import { parseArgs } from "util";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import type { Server } from "socket.io";
import type {
  Faction,
  GameRoom,
  Player,
  Role,
  StateVariables,
} from "../packages/shared/src/index.js";
import {
  INITIAL_STATE,
  FACTIONS,
  TOTAL_ROUNDS,
  resolveDecisions,
  clampState,
  computeEndingArcs,
} from "../packages/shared/src/index.js";
import { createRoom } from "../packages/server/src/rooms.js";
import { triggerGeneration } from "../packages/server/src/generation/orchestrator.js";
import { getGenerationStatus } from "../packages/server/src/generation/cache.js";
import {
  getActiveDecisions,
  checkThresholds,
} from "../packages/server/src/game.js";
import { updateStoryBible } from "../packages/server/src/generation/context.js";
import { applyActivityPenalties } from "../packages/server/src/activityPenalties.js";
import { resetMicroActionCounts } from "../packages/server/src/microActions.js";
import { getLoggerForRoom, closeLoggerForRoom } from "../packages/server/src/logger/registry.js";
import { EVENT_NAMES } from "../packages/server/src/logger/index.js";

// ── CLI args ──────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    output: { type: "string", short: "o" },
    seed: { type: "string" },
    verbose: { type: "boolean", short: "v", default: false },
  },
  strict: false,
});

const SEED = args.seed !== undefined ? parseInt(args.seed, 10) : undefined;

function log(msg: string) {
  console.log(`[run-full-game] ${msg}`);
}

function verbose(msg: string) {
  if (args.verbose) console.log(`  ${msg}`);
}

// ── Mock IO ───────────────────────────────────────────────────────────────────

interface CapturedEmission {
  target: string;
  event: string;
  data: unknown;
}

function createMockIO() {
  const emissions: CapturedEmission[] = [];

  const chainable = (target: string) => ({
    emit(event: string, data: unknown) {
      emissions.push({ target, event, data });
    },
  });

  const io = {
    to(target: string) { return chainable(target); },
    in(target: string) { return chainable(target); },
  } as unknown as Server;

  return { io, emissions };
}

// ── PRNG ──────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = SEED !== undefined ? mulberry32(SEED) : Math.random.bind(Math);

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

// ── Seed all 16 players as bots ───────────────────────────────────────────────

function seedAllBots(room: GameRoom): void {
  for (const faction of FACTIONS) {
    for (const roleConfig of faction.roles) {
      const botId = `__bot_${faction.id}_${roleConfig.id}`;
      const bot: Player = {
        id: botId,
        name: `Bot ${roleConfig.label}`,
        faction: faction.id as Faction,
        role: roleConfig.id as Role,
        isLeader: roleConfig.isLeader,
        connected: true,
      };
      room.players[botId] = bot;
    }
  }
  log(`Seeded ${Object.keys(room.players).length} bots`);
}

// ── Submit bot decisions synchronously ────────────────────────────────────────

function submitBotDecisions(room: GameRoom): Record<string, { role: string; optionId: string; label: string }> {
  const roundDecisions = getActiveDecisions(room, room.round);
  if (!roundDecisions) return {};

  const summary: Record<string, { role: string; optionId: string; label: string }> = {};

  for (const [botId, bot] of Object.entries(room.players)) {
    if (!bot.faction || !bot.role) continue;

    // Individual decision (slot 1)
    const individuals = roundDecisions.individual.filter((d) => d.role === bot.role);
    if (individuals[0]?.options.length) {
      const opt = pickRandom(individuals[0].options);
      room.decisions[botId] = opt.id;
      summary[`${bot.role}:individual`] = { role: bot.role, optionId: opt.id, label: opt.label };
      verbose(`${bot.role} chose individual: ${opt.label}`);
    }

    // Individual decision (slot 2)
    if (individuals[1]?.options.length) {
      const opt = pickRandom(individuals[1].options);
      room.decisions2[botId] = opt.id;
      summary[`${bot.role}:individual2`] = { role: bot.role, optionId: opt.id, label: opt.label };
      verbose(`${bot.role} chose individual2: ${opt.label}`);
    }

    // Team vote
    const team = roundDecisions.team.find((d) => d.faction === bot.faction);
    if (team?.options.length) {
      const opt = pickRandom(team.options);
      room.teamVotes[bot.faction!] ??= {};
      room.teamVotes[bot.faction!][botId] = opt.id;
      verbose(`${bot.role} voted team: ${opt.label}`);
    }

    // Leader locks team decision
    if (bot.isLeader && team?.options.length) {
      const opt = pickRandom(team.options);
      room.teamDecisions[bot.faction!] = opt.id;
      summary[`${bot.faction}:team`] = { role: bot.role, optionId: opt.id, label: opt.label };
      verbose(`${bot.role} leader-locked: ${opt.label}`);
    }
  }

  return summary;
}

// ── Resolve round (simplified emitResolution without IO emissions) ────────────

function resolveRound(room: GameRoom, io: Server): {
  stateBefore: StateVariables;
  stateAfter: StateVariables;
  chosenLabels: Record<string, string>;
  thresholdsFired: string[];
} {
  const roundDecisions = getActiveDecisions(room, room.round);
  const stateBefore = { ...room.state };

  // Collect all chosen DecisionOption objects
  const chosenOptions: { id: string; label: string; description: string; effects: any[] }[] = [];
  const chosenLabels: Record<string, string> = {};
  const roleDecisions: Record<string, string> = {};
  const chosenEffects: Record<string, any[]> = {};

  // Individual decisions
  for (const [playerId, optionId] of Object.entries(room.decisions)) {
    const player = room.players[playerId];
    if (!player || !roundDecisions) continue;
    for (const indiv of roundDecisions.individual) {
      const opt = indiv.options.find((o) => o.id === optionId);
      if (opt) {
        chosenOptions.push(opt);
        chosenLabels[optionId] = opt.label;
        chosenEffects[optionId] = opt.effects;
        if (player.role) roleDecisions[player.role] = optionId;
        break;
      }
    }
  }

  // Second individual decisions
  for (const [playerId, optionId] of Object.entries(room.decisions2 ?? {})) {
    const player = room.players[playerId];
    if (!player || !roundDecisions) continue;
    for (const indiv of roundDecisions.individual) {
      const opt = indiv.options.find((o) => o.id === optionId);
      if (opt) {
        chosenOptions.push(opt);
        chosenLabels[optionId] = opt.label;
        chosenEffects[optionId] = opt.effects;
        if (player.role) roleDecisions[player.role + ":2"] = optionId;
        break;
      }
    }
  }

  // Team decisions
  const teamDecisionSummary: Record<string, { optionId: string; label: string }> = {};
  for (const [faction, optionId] of Object.entries(room.teamDecisions)) {
    if (!roundDecisions) continue;
    const teamDec = roundDecisions.team.find((t) => t.faction === (faction as Faction));
    if (!teamDec) continue;
    const opt = teamDec.options.find((o) => o.id === optionId);
    if (opt) {
      chosenOptions.push(opt);
      teamDecisionSummary[faction] = { optionId: opt.id, label: opt.label };
      chosenLabels[optionId] = opt.label;
      chosenEffects[optionId] = opt.effects;
    }
  }

  // Apply decisions to state
  const stateAfter = resolveDecisions(stateBefore, chosenOptions);
  room.state = stateAfter;

  // Activity penalties (bots don't open apps, so all get penalized — realistic worst case)
  applyActivityPenalties(room);
  clampState(room.state);
  room.playerActivity = {};

  // Track thresholds fired this round
  const thresholdsBefore = new Set(room.firedThresholds ?? []);

  checkThresholds(io, room);

  const thresholdsFired = [...(room.firedThresholds ?? [])].filter(
    (t) => !thresholdsBefore.has(t),
  );

  // Update story bible
  updateStoryBible(room);

  // Record history
  const historyEntry = {
    round: room.round,
    decisions: { ...room.decisions },
    decisions2: { ...room.decisions2 },
    teamDecisions: { ...room.teamDecisions },
    stateBefore,
    stateAfter: { ...room.state },
    roleDecisions,
    chosenLabels,
    chosenEffects,
  };
  const existingIdx = room.history.findIndex((h) => h.round === room.round);
  if (existingIdx >= 0) {
    room.history[existingIdx] = historyEntry;
  } else {
    room.history.push(historyEntry);
  }

  // Trigger generation for next round (async, fire-and-forget)
  void triggerGeneration(room, room.round + 1, undefined, io);

  return { stateBefore, stateAfter: { ...room.state }, chosenLabels, thresholdsFired };
}

// ── Wait for generation ───────────────────────────────────────────────────────

async function waitForGeneration(room: GameRoom, round: number, timeoutMs = 300_000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = getGenerationStatus(room, round);
    if (status === "ready" || status === "failed") return status;
    await new Promise((r) => setTimeout(r, 500));
  }
  return "timeout";
}

// ── Collect round artifacts ───────────────────────────────────────────────────

function collectRoundData(room: GameRoom, round: number) {
  const artifacts = room.generatedRounds?.[round];
  return {
    briefing: artifacts?.briefing ?? null,
    content: artifacts?.content ?? null,
    sharedContent: artifacts?.sharedContent ?? null,
    npcTriggers: artifacts?.npcTriggers ?? null,
    decisions: artifacts?.decisions ?? null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  // Validate env
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY is required");
    process.exit(1);
  }

  // Generation config — increase timeout and concurrency for batch run
  process.env.GEN_ENABLED = "true";
  process.env.GEN_BRIEFINGS_ENABLED = "true";
  process.env.GEN_NPC_ENABLED = "true";
  process.env.GEN_DECISIONS_ENABLED = "true";
  process.env.LOG_ENABLED = "true";
  process.env.GEN_TIMEOUT_MS ??= "120000";       // 2min per call (default 30s too tight)
  process.env.GEN_MAX_CONCURRENT ??= "10";        // more parallelism for batch

  const { io, emissions } = createMockIO();

  // Create room
  const room = createRoom("__sim__");
  room.generationEnabled = true;
  log(`Created room ${room.code}`);

  // Seed all 16 bots
  seedAllBots(room);

  // Game output structure
  const gameOutput: {
    metadata: {
      timestamp: string;
      seed: number | null;
      roomCode: string;
      durationMs: number;
      models: { briefing: string; content: string; decision: string };
    };
    initialState: StateVariables;
    rounds: any[];
    endingArcs: any;
    finalState: StateVariables;
    storyBible: any;
  } = {
    metadata: {
      timestamp: new Date().toISOString(),
      seed: SEED ?? null,
      roomCode: room.code,
      durationMs: 0,
      models: {
        briefing: process.env.GEN_BRIEFING_MODEL ?? "claude-sonnet-4-5-20250514",
        content: process.env.GEN_CONTENT_MODEL ?? "claude-haiku-4-5-20251001",
        decision: process.env.GEN_DECISION_MODEL ?? process.env.GEN_BRIEFING_MODEL ?? "claude-sonnet-4-5-20250514",
      },
    },
    initialState: { ...INITIAL_STATE },
    rounds: [],
    endingArcs: null,
    finalState: INITIAL_STATE,
    storyBible: null,
  };

  // ── Game loop ───────────────────────────────────────────────────────────────

  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    const roundStart = Date.now();
    log(`\n════ Round ${round} ════`);

    // 1. Trigger generation for this round (round 1 is triggered here;
    //    rounds 2-5 are triggered by resolution of the previous round)
    if (round === 1) {
      log("Triggering generation for round 1...");
      await triggerGeneration(room, 1, undefined, io);
    }

    // 2. Wait for generation to complete
    log("Waiting for generation...");
    const genStatus = await waitForGeneration(room, round);
    log(`Generation status: ${genStatus}`);

    if (genStatus === "timeout") {
      console.error(`ERROR: Generation timed out for round ${round}`);
      break;
    }

    // 3. Collect generated artifacts and log failures
    const artifacts = collectRoundData(room, round);
    const decisionCount = artifacts.decisions
      ? `${artifacts.decisions.individual.length} individual, ${artifacts.decisions.team.length} team`
      : "none";
    const contentFactions = artifacts.content ? Object.keys(artifacts.content) : [];
    log(`Generated: briefing=${!!artifacts.briefing}, content=[${contentFactions.join(",")}], npc=${!!artifacts.npcTriggers}, decisions=${decisionCount}`);
    if (!artifacts.briefing) log("  WARN: Briefing generation failed (likely validation — word count bounds)");
    if (!artifacts.content || contentFactions.length < 4) log("  WARN: Content generation failed for some factions (likely validation budget or timeout)");
    if (!artifacts.decisions) log("  WARN: Decision generation failed (likely validation — effect constraints)");

    // 4. Set up the round
    room.round = round;
    room.phase = "briefing";
    room.decisions = {};
    room.decisions2 = {};
    room.teamDecisions = {};
    room.teamVotes = {};
    resetMicroActionCounts(room);

    // 5. Emit phase content (captured by mock IO for reference)
    room.phase = "decision";

    // 6. Submit bot decisions
    log("Submitting bot decisions...");
    const decisionSummary = submitBotDecisions(room);

    // 7. Resolve round
    room.phase = "resolution";
    log("Resolving round...");
    const resolution = resolveRound(room, io);

    if (resolution.thresholdsFired.length > 0) {
      log(`Thresholds fired: ${resolution.thresholdsFired.join(", ")}`);
    }

    // 8. Record round data
    const roundDurationMs = Date.now() - roundStart;
    const roundData = {
      round,
      durationMs: roundDurationMs,
      generationStatus: genStatus,
      artifacts,
      stateBefore: resolution.stateBefore,
      stateAfter: resolution.stateAfter,
      decisionSummary,
      chosenLabels: resolution.chosenLabels,
      thresholdsFired: resolution.thresholdsFired,
    };
    gameOutput.rounds.push(roundData);

    // Log key state changes
    const stateChanges = (Object.keys(resolution.stateAfter) as (keyof StateVariables)[])
      .filter((k) => resolution.stateAfter[k] !== resolution.stateBefore[k])
      .map((k) => `${k}: ${resolution.stateBefore[k]} → ${resolution.stateAfter[k]}`)
      .slice(0, 8);
    log(`Key state changes: ${stateChanges.join(", ")}${stateChanges.length >= 8 ? "..." : ""}`);
    log(`Round ${round} complete (${(roundDurationMs / 1000).toFixed(1)}s)`);
  }

  // ── Ending ──────────────────────────────────────────────────────────────────

  const arcs = computeEndingArcs(room.state);
  gameOutput.endingArcs = arcs;
  gameOutput.finalState = { ...room.state };
  gameOutput.storyBible = room.storyBible ?? null;
  gameOutput.metadata.durationMs = Date.now() - startTime;

  // Close logger
  await closeLoggerForRoom(room.code);

  // ── Write output ────────────────────────────────────────────────────────────

  const outputDir = "output";
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputPath = args.output ?? `${outputDir}/game-${timestamp}.json`;

  // Ensure parent directory exists
  const parentDir = outputPath.substring(0, outputPath.lastIndexOf("/"));
  if (parentDir && !existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });

  // Custom replacer to handle Set → Array conversion
  const replacer = (_key: string, value: unknown) => value instanceof Set ? [...value] : value;
  writeFileSync(outputPath, JSON.stringify(gameOutput, replacer, 2));

  log(`\n════ Game Complete ════`);
  log(`Duration: ${(gameOutput.metadata.durationMs / 1000).toFixed(1)}s`);
  log(`Output: ${outputPath}`);
  log(`View: open scripts/view-game.html in a browser and load the JSON file`);

  // Print ending arc summary
  if (arcs && arcs.length > 0) {
    log(`\nEnding Arcs:`);
    for (const arc of arcs) {
      log(`  ${arc.label}: ${arc.spectrum[arc.result]}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
