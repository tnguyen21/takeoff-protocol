#!/usr/bin/env bun
/**
 * Analyze a JSONL game log file and produce a human-readable session summary.
 *
 * Usage:
 *   bun scripts/analyze-game.ts <path-to-jsonl-file>
 */

import { readFileSync } from "fs";
import type { GameEventEnvelope } from "../packages/server/src/logger/types.js";

// ── Parsing ──────────────────────────────────────────────────────────────────

export function parseLines(content: string): { events: GameEventEnvelope[]; malformed: number } {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  let malformed = 0;
  const events: GameEventEnvelope[] = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      events.push(obj as GameEventEnvelope);
    } catch {
      process.stderr.write(`[warn] malformed line skipped: ${line.slice(0, 80)}\n`);
      malformed++;
    }
  }

  return { events, malformed };
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

// ── Summary generation ────────────────────────────────────────────────────────

export function generateSummary(events: GameEventEnvelope[]): string {
  if (events.length === 0) return "No events found.";

  const lines: string[] = [];

  // Group events by type
  const byType = new Map<string, GameEventEnvelope[]>();
  for (const ev of events) {
    const list = byType.get(ev.event) ?? [];
    list.push(ev);
    byType.set(ev.event, list);
  }

  const get = (type: string): GameEventEnvelope[] => byType.get(type) ?? [];

  // ── 1. Session Metadata ────────────────────────────────────────────────────

  lines.push("=== Session Metadata ===");

  const roomCreated = get("room.created")[0];
  const gameStarted = get("game.started")[0];

  const roomCode =
    (roomCreated?.data as { code?: string } | undefined)?.code ??
    (gameStarted?.data as { roomCode?: string } | undefined)?.roomCode ??
    "unknown";

  const sessionId = events[0]?.sessionId ?? "unknown";

  const times = events.map((e) => e.serverTime);
  const firstTime = Math.min(...times);
  const lastTime = Math.max(...times);
  const durationMs = lastTime - firstTime;

  const roundNumbers = events
    .filter((e) => e.round !== null)
    .map((e) => e.round as number);
  const maxRound = roundNumbers.length > 0 ? Math.max(...roundNumbers) : 0;

  lines.push(`Room code:  ${roomCode}`);
  lines.push(`Session ID: ${sessionId}`);
  lines.push(`Duration:   ${formatDuration(durationMs)}`);
  lines.push(`Rounds:     ${maxRound > 0 ? maxRound : "none"}`);

  // Phase timing breakdown
  const phaseChangedEvents = get("phase.changed");
  if (phaseChangedEvents.length > 0) {
    lines.push("\nPhase timing breakdown:");
    const phaseTotals = new Map<string, number>();
    for (const ev of phaseChangedEvents) {
      const d = ev.data as { from?: string; durationMs?: number };
      if (d.from && d.durationMs !== undefined && d.durationMs > 0) {
        phaseTotals.set(d.from, (phaseTotals.get(d.from) ?? 0) + d.durationMs);
      }
    }
    if (phaseTotals.size === 0) {
      lines.push("  No phase duration data available.");
    } else {
      for (const [phase, ms] of phaseTotals) {
        lines.push(`  ${pad(phase, 14)}: ${formatDuration(ms)}`);
      }
    }
  } else {
    lines.push("Phase timing: No phase.changed events recorded.");
  }

  // Player roster
  type PlayerEntry = { name?: string; faction?: string; role?: string };
  const playerData = gameStarted?.data as { players?: PlayerEntry[] } | undefined;
  if (playerData?.players && playerData.players.length > 0) {
    lines.push("\nPlayer roster:");
    lines.push(`  ${"Name".padEnd(16)}  ${"Faction".padEnd(14)}  Role`);
    lines.push(`  ${"─".repeat(16)}  ${"─".repeat(14)}  ${"─".repeat(20)}`);
    for (const p of playerData.players) {
      lines.push(`  ${pad(p.name ?? "?", 16)}  ${pad(p.faction ?? "?", 14)}  ${p.role ?? "?"}`);
    }
  } else {
    lines.push("\nPlayer roster: No game.started event found.");
  }

  lines.push("");

  // ── 2. Decision Stats ──────────────────────────────────────────────────────

  lines.push("=== Decision Stats ===");

  const individualSubmissions = get("decision.individual_submitted");
  const teamVotes = get("decision.team_vote");
  const teamLocked = get("decision.team_locked");
  const inactions = get("decision.inaction");

  if (
    individualSubmissions.length === 0 &&
    teamLocked.length === 0 &&
    inactions.length === 0
  ) {
    lines.push("No decisions recorded.");
  } else {
    const allRounds = [
      ...new Set(
        events
          .filter((e) => e.round !== null && e.round > 0)
          .map((e) => e.round as number),
      ),
    ].sort((a, b) => a - b);

    const totalPlayers = playerData?.players?.length ?? 0;

    for (const r of allRounds) {
      lines.push(`\nRound ${r}:`);

      const rIndiv = individualSubmissions.filter((e) => e.round === r);
      if (rIndiv.length > 0) {
        lines.push("  Individual choices:");
        for (const ev of rIndiv) {
          const d = ev.data as { playerName?: string; role?: string; optionId?: string };
          lines.push(`    ${pad(d.playerName ?? "?", 16)} [${d.role ?? "?"}] → ${d.optionId ?? "?"}`);
        }
      }

      const rLocked = teamLocked.filter((e) => e.round === r);
      if (rLocked.length > 0) {
        lines.push("  Team decisions (locked):");
        for (const ev of rLocked) {
          const d = ev.data as { faction?: string; optionId?: string; leaderName?: string };
          lines.push(`    ${pad(d.faction ?? "?", 14)} → ${d.optionId ?? "?"} (by ${d.leaderName ?? "?"})`);
        }
      }

      const rVotes = teamVotes.filter((e) => e.round === r);
      if (rVotes.length > 0) {
        // Compute vote tallies per faction
        const tally = new Map<string, Map<string, number>>();
        for (const ev of rVotes) {
          const d = ev.data as { faction?: string; optionId?: string };
          if (!d.faction || !d.optionId) continue;
          if (!tally.has(d.faction)) tally.set(d.faction, new Map());
          const fMap = tally.get(d.faction)!;
          fMap.set(d.optionId, (fMap.get(d.optionId) ?? 0) + 1);
        }
        lines.push("  Team votes:");
        for (const [faction, voteMap] of tally) {
          const sorted = [...voteMap.entries()].sort((a, b) => b[1] - a[1]);
          const majority = sorted[0][0];
          const lockedEv = rLocked.find(
            (e) => (e.data as { faction?: string }).faction === faction,
          );
          const lockedId = (lockedEv?.data as { optionId?: string } | undefined)?.optionId;
          const override =
            lockedId && lockedId !== majority
              ? ` ⚠ leader override (majority voted: ${majority})`
              : "";
          const tallyStr = sorted.map(([opt, cnt]) => `${opt}×${cnt}`).join(", ");
          lines.push(`    ${pad(faction, 14)}: [${tallyStr}]${override}`);
        }
      }

      // Inactions
      const rInactions = inactions.filter((e) => e.round === r);
      if (rInactions.length > 0) {
        lines.push(`  Inactions: ${rInactions.length}`);
        for (const ev of rInactions) {
          const d = ev.data as { faction?: string; reason?: string };
          lines.push(`    ${d.faction ?? "?"}: ${d.reason ?? "no reason given"}`);
        }
      }

      // Submission rate
      if (totalPlayers > 0) {
        lines.push(
          `  Submission rate: ${rIndiv.length}/${totalPlayers} players submitted individual decisions`,
        );
      }
    }
  }

  lines.push("");

  // ── 3. Activity Stats ──────────────────────────────────────────────────────

  lines.push("=== Activity Stats ===");

  const activityReports = get("activity.report");
  const activityPenalties = get("activity.penalty");

  if (activityReports.length === 0 && activityPenalties.length === 0) {
    lines.push("No activity data recorded.");
  } else {
    // Per-player apps opened (use last report if multiple per player)
    const playerApps = new Map<string, string[]>();
    for (const ev of activityReports) {
      const d = ev.data as { playerName?: string; appsOpened?: string[] };
      if (d.playerName && d.appsOpened) {
        playerApps.set(d.playerName, d.appsOpened);
      }
    }

    if (playerApps.size > 0) {
      lines.push("Per-player apps opened:");
      for (const [player, apps] of playerApps) {
        lines.push(`  ${pad(player, 16)}: ${apps.join(", ")}`);
      }

      // App frequency across all players
      const appCounts = new Map<string, number>();
      for (const apps of playerApps.values()) {
        for (const app of apps) {
          appCounts.set(app, (appCounts.get(app) ?? 0) + 1);
        }
      }
      if (appCounts.size > 0) {
        const sorted = [...appCounts.entries()].sort((a, b) => b[1] - a[1]);
        lines.push(`Most opened:  ${sorted[0][0]} (${sorted[0][1]} player(s))`);
        lines.push(
          `Least opened: ${sorted[sorted.length - 1][0]} (${sorted[sorted.length - 1][1]} player(s))`,
        );
      }
    }

    // Penalties
    if (activityPenalties.length > 0) {
      lines.push(`\nMissed primary app penalties: ${activityPenalties.length}`);
      for (const ev of activityPenalties) {
        const d = ev.data as {
          playerName?: string;
          role?: string;
          missedApp?: string;
          variable?: string;
          delta?: number;
        };
        const deltaStr =
          d.delta !== undefined ? ` → ${d.variable ?? "?"} ${d.delta >= 0 ? "+" : ""}${d.delta}` : "";
        lines.push(
          `  ${pad(d.playerName ?? "?", 16)} missed ${d.missedApp ?? "?"}${deltaStr}`,
        );
      }
    } else {
      lines.push("No activity penalties recorded.");
    }
  }

  lines.push("");

  // ── 4. Communication Stats ─────────────────────────────────────────────────

  lines.push("=== Communication Stats ===");

  const messageSent = get("message.sent");
  const messageNpc = get("message.npc");

  if (messageSent.length === 0 && messageNpc.length === 0) {
    lines.push("No messages recorded.");
  } else {
    const teamMessages = messageSent.filter(
      (e) => (e.data as { isTeamChat?: boolean }).isTeamChat === true,
    );
    const dmMessages = messageSent.filter(
      (e) => (e.data as { isTeamChat?: boolean }).isTeamChat !== true,
    );

    lines.push(
      `Total messages: ${messageSent.length} player + ${messageNpc.length} NPC = ${messageSent.length + messageNpc.length}`,
    );
    lines.push(`  Team chat: ${teamMessages.length},  DMs: ${dmMessages.length}`);

    // Per-faction counts
    const factionCounts = new Map<string, number>();
    for (const ev of messageSent) {
      const d = ev.data as { faction?: string };
      if (d.faction) {
        factionCounts.set(d.faction, (factionCounts.get(d.faction) ?? 0) + 1);
      }
    }
    if (factionCounts.size > 0) {
      lines.push("Messages per faction:");
      for (const [faction, count] of factionCounts) {
        lines.push(`  ${pad(faction, 14)}: ${count}`);
      }
    }

    // NPC messages
    if (messageNpc.length > 0) {
      lines.push(`\nNPC messages: ${messageNpc.length}`);
      for (const ev of messageNpc) {
        const d = ev.data as {
          npcId?: string;
          npcName?: string;
          targetPlayerName?: string;
          contentLength?: number;
        };
        const sender = d.npcName ?? d.npcId ?? "?";
        lines.push(
          `  ${pad(sender, 20)} → ${d.targetPlayerName ?? "?"} (${d.contentLength ?? "?"} chars)`,
        );
      }
    }

    // Average message length
    const lengths = messageSent.map(
      (e) => (e.data as { contentLength?: number }).contentLength ?? 0,
    );
    if (lengths.length > 0) {
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      lines.push(`\nAverage message length: ${avg.toFixed(0)} chars`);
    }
  }

  lines.push("");

  // ── 5. State Trajectory ────────────────────────────────────────────────────

  lines.push("=== State Trajectory ===");

  const snapshots = get("state.snapshot");
  const deltas = get("state.delta");
  const gmOverrides = get("state.gm_override");

  if (snapshots.length === 0 && deltas.length === 0 && gmOverrides.length === 0) {
    lines.push("No state events recorded.");
  } else {
    if (snapshots.length > 0) {
      lines.push(`State snapshots: ${snapshots.length} captured`);
      for (const ev of snapshots) {
        const d = ev.data as { label?: string };
        const label = d.label ?? `round ${ev.round ?? "?"} ${ev.phase ?? ""}`.trim();
        lines.push(`  [${label}] round ${ev.round ?? "?"}, phase ${ev.phase ?? "?"}`);
      }
    }

    if (deltas.length > 0) {
      lines.push("\nState deltas per round:");
      for (const ev of deltas) {
        const d = ev.data as {
          round?: number;
          deltas?: Array<{ variable: string; delta: number; oldValue?: number; newValue?: number }>;
        };
        const r = d.round ?? ev.round ?? "?";
        lines.push(`  Round ${r}:`);
        if (d.deltas && d.deltas.length > 0) {
          for (const delta of d.deltas) {
            const sign = delta.delta >= 0 ? "+" : "";
            const range =
              delta.oldValue !== undefined ? ` (${delta.oldValue} → ${delta.newValue})` : "";
            lines.push(`    ${pad(delta.variable, 30)} ${sign}${delta.delta}${range}`);
          }
        } else {
          lines.push("    No variable changes.");
        }
      }
    } else {
      lines.push("No state deltas recorded.");
    }

    if (gmOverrides.length > 0) {
      lines.push(`\nGM overrides: ${gmOverrides.length}`);
      for (const ev of gmOverrides) {
        const d = ev.data as { variable?: string; oldValue?: number | string; newValue?: number | string };
        lines.push(
          `  ${d.variable ?? "?"}: ${d.oldValue ?? "?"} → ${d.newValue ?? "?"} (round ${ev.round ?? "?"}, phase ${ev.phase ?? "?"})`,
        );
      }
    } else {
      lines.push("No GM overrides recorded.");
    }
  }

  lines.push("");

  // ── 6. Trigger Report ─────────────────────────────────────────────────────

  lines.push("=== Trigger Report ===");

  const thresholdFired = get("threshold.fired");
  const npcTriggerFired = get("npc_trigger.fired");
  const publishSubmitted = get("publish.submitted");

  let anyTriggers = false;

  if (thresholdFired.length > 0) {
    anyTriggers = true;
    lines.push("Thresholds fired:");
    for (const ev of thresholdFired) {
      const d = ev.data as {
        thresholdId?: string;
        effects?: Array<{ variable: string; delta: number }>;
      };
      const id = d.thresholdId ?? "?";
      const effectStr = d.effects
        ? d.effects.map((e) => `${e.variable}${e.delta >= 0 ? "+" : ""}${e.delta}`).join(", ")
        : "";
      lines.push(`  [round ${ev.round ?? "?"}] ${id}${effectStr ? ` → ${effectStr}` : ""}`);
    }
  }

  if (npcTriggerFired.length > 0) {
    anyTriggers = true;
    lines.push("NPC triggers fired:");
    for (const ev of npcTriggerFired) {
      const d = ev.data as { triggerId?: string; npcId?: string; targetFaction?: string };
      lines.push(
        `  [round ${ev.round ?? "?"}] ${d.triggerId ?? "?"} (npc: ${d.npcId ?? "?"}, target: ${d.targetFaction ?? "?"})`,
      );
    }
  }

  if (publishSubmitted.length > 0) {
    anyTriggers = true;
    lines.push("Publishing events:");
    for (const ev of publishSubmitted) {
      const d = ev.data as { playerName?: string; role?: string; type?: string; title?: string };
      lines.push(
        `  [round ${ev.round ?? "?"}] ${d.type ?? "?"}: "${d.title ?? "?"}" by ${d.playerName ?? "?"} (${d.role ?? "?"})`,
      );
    }
  }

  if (!anyTriggers) {
    lines.push("No triggers or publishing events recorded.");
  }

  return lines.join("\n");
}

// ── CLI entry point ───────────────────────────────────────────────────────────

if (import.meta.main) {
  const filePath = process.argv[2];
  if (!filePath) {
    process.stderr.write("Usage: bun scripts/analyze-game.ts <path-to-jsonl-file>\n");
    process.exit(1);
  }

  let content: string;
  try {
    content = readFileSync(filePath, "utf8");
  } catch (err) {
    process.stderr.write(`Error reading file: ${err}\n`);
    process.exit(1);
  }

  const { events, malformed } = parseLines(content);

  if (malformed > 0) {
    process.stderr.write(`[warn] ${malformed} malformed line(s) skipped\n`);
  }

  console.log(generateSummary(events));
}
