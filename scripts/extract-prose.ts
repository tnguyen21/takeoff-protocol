#!/usr/bin/env bun
/**
 * Extract all generated prose from a game JSON into a readable markdown file.
 * Includes: briefings, content, NPC messages, decisions, state changes,
 * thresholds, ending arcs, story bible, and LLM prompts.
 *
 * Usage: bun scripts/extract-prose.ts output/game-YYYY-MM-DDTHH-MM-SS.json
 */

import { readFileSync, writeFileSync } from "fs";
import { basename } from "path";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: bun scripts/extract-prose.ts <game.json>");
  process.exit(1);
}

const data = JSON.parse(readFileSync(inputPath, "utf-8"));
const lines: string[] = [];

function hr() { lines.push("", "---", ""); }
function fmt(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(1);
}

const FACTION_NAMES: Record<string, string> = {
  openbrain: "OpenBrain", prometheus: "Prometheus", china: "China", external: "External",
};

// Header
const meta = data.metadata;
lines.push(`# Game Prose Review`);
lines.push(`> ${meta.timestamp.slice(0, 19)} | Room: ${meta.roomCode} | Duration: ${(meta.durationMs / 1000).toFixed(0)}s | Seed: ${meta.seed ?? "random"}`);
lines.push(`> Models — briefing: ${meta.models.briefing} | content: ${meta.models.content} | decision: ${meta.models.decision}`);
lines.push("");

for (const round of data.rounds) {
  const r = round.round;
  lines.push(`# Round ${r}`);
  lines.push(`> Generation: ${round.generationStatus} | Duration: ${(round.durationMs / 1000).toFixed(1)}s`);
  hr();

  // ── Briefing ────────────────────────────────────────────────────────────────
  if (round.artifacts.briefing) {
    const b = round.artifacts.briefing;
    lines.push(`## Briefing`);
    lines.push("");
    lines.push(`### Common`);
    lines.push(b.common);
    lines.push("");
    for (const [faction, text] of Object.entries(b.factionVariants)) {
      lines.push(`### ${FACTION_NAMES[faction] || faction} Variant`);
      lines.push(text as string);
      lines.push("");
    }
    hr();
  }

  // ── Content ─────────────────────────────────────────────────────────────────
  if (round.artifacts.content) {
    lines.push(`## Content`);
    lines.push("");

    for (const [faction, appContents] of Object.entries(round.artifacts.content) as [string, any[]][]) {
      lines.push(`### ${FACTION_NAMES[faction] || faction}`);
      lines.push("");

      for (const ac of appContents) {
        lines.push(`#### ${ac.app}`);
        lines.push("");
        for (const item of ac.items) {
          const parts: string[] = [];
          if (item.sender) parts.push(`**${item.sender}**`);
          if (item.subject) parts.push(`*${item.subject}*`);
          parts.push(item.body);
          const itemMeta = [item.type, item.classification].filter(Boolean).join(" · ");
          lines.push(`- ${parts.join(" — ")}  `);
          lines.push(`  \`${itemMeta}\``);
        }
        lines.push("");
      }
    }

    // Shared content (substack)
    if (round.artifacts.sharedContent?.length) {
      lines.push(`### Shared Feed`);
      lines.push("");
      for (const ac of round.artifacts.sharedContent) {
        lines.push(`#### ${ac.app}`);
        lines.push("");
        for (const item of ac.items) {
          const parts: string[] = [];
          if (item.sender) parts.push(`**${item.sender}**`);
          if (item.subject) parts.push(`*${item.subject}*`);
          parts.push(item.body);
          lines.push(`- ${parts.join(" — ")}`);
        }
        lines.push("");
      }
    }
    hr();
  }

  // ── NPC Triggers ────────────────────────────────────────────────────────────
  if (round.artifacts.npcTriggers?.length) {
    lines.push(`## NPC Messages`);
    lines.push("");
    for (const t of round.artifacts.npcTriggers) {
      const target = [
        t.target?.faction && `faction: ${t.target.faction}`,
        t.target?.role && `role: ${t.target.role}`,
      ].filter(Boolean).join(", ");
      const timing = t.schedule
        ? `R${t.schedule.round} ${t.schedule.phase}`
        : `when ${t.condition.variable} ${t.condition.operator} ${t.condition.value}`;
      lines.push(`- **${t.npcId}** → ${target}  `);
      lines.push(`  ${t.content}  `);
      lines.push(`  \`${timing}\``);
    }
    lines.push("");
    hr();
  }

  // ── Decisions ───────────────────────────────────────────────────────────────
  if (round.artifacts.decisions) {
    const dec = round.artifacts.decisions;
    lines.push(`## Decisions`);
    lines.push("");

    if (dec.individual?.length) {
      lines.push(`### Individual`);
      lines.push("");
      for (const d of dec.individual) {
        lines.push(`#### ${d.role}`);
        lines.push(d.prompt);
        lines.push("");
        for (const opt of d.options) {
          const effects = (opt.effects || [])
            .map((e: any) => `${e.variable} ${e.delta >= 0 ? "+" : ""}${e.delta}`)
            .join(", ");
          lines.push(`- **${opt.label}** — ${opt.description}  `);
          lines.push(`  \`${effects}\``);
        }
        lines.push("");
      }
    }

    if (dec.team?.length) {
      lines.push(`### Team`);
      lines.push("");
      for (const d of dec.team) {
        lines.push(`#### ${FACTION_NAMES[d.faction] || d.faction}`);
        lines.push(d.prompt);
        lines.push("");
        for (const opt of d.options) {
          const effects = (opt.effects || [])
            .map((e: any) => `${e.variable} ${e.delta >= 0 ? "+" : ""}${e.delta}`)
            .join(", ");
          lines.push(`- **${opt.label}** — ${opt.description}  `);
          lines.push(`  \`${effects}\``);
        }
        lines.push("");
      }
    }
    hr();
  }

  // ── Decision Summary (what bots chose) ──────────────────────────────────────
  if (round.decisionSummary && Object.keys(round.decisionSummary).length > 0) {
    lines.push(`## Decision Summary`);
    lines.push("");
    for (const [key, val] of Object.entries(round.decisionSummary) as [string, any][]) {
      const chosen = round.chosenLabels?.[val.optionId] || val.label || val.optionId;
      lines.push(`- **${key}** → ${chosen}`);
    }
    lines.push("");
    hr();
  }

  // ── Thresholds Fired ────────────────────────────────────────────────────────
  if (round.thresholdsFired?.length) {
    lines.push(`## Thresholds Fired`);
    lines.push("");
    for (const t of round.thresholdsFired) {
      lines.push(`- ${t}`);
    }
    lines.push("");
    hr();
  }

  // ── State Changes ──────────────────────────────────────────────────────────
  if (round.stateBefore && round.stateAfter) {
    const changed = Object.keys(round.stateBefore)
      .filter((k: string) => round.stateBefore[k] !== round.stateAfter[k])
      .sort((a: string, b: string) => Math.abs(round.stateAfter[b] - round.stateBefore[b]) - Math.abs(round.stateAfter[a] - round.stateBefore[a]));

    if (changed.length > 0) {
      lines.push(`## State Changes`);
      lines.push("");
      lines.push("| Variable | Before | After | Delta |");
      lines.push("|----------|--------|-------|-------|");
      for (const k of changed) {
        const delta = round.stateAfter[k] - round.stateBefore[k];
        const sign = delta > 0 ? "+" : "";
        lines.push(`| ${k} | ${fmt(round.stateBefore[k])} | ${fmt(round.stateAfter[k])} | ${sign}${fmt(delta)} |`);
      }
      lines.push("");
      hr();
    }
  }

  // ── Prompts ─────────────────────────────────────────────────────────────────
  if (round.artifacts.prompts?.length) {
    lines.push(`## Prompts`);
    lines.push("");
    for (const p of round.artifacts.prompts) {
      lines.push(`### ${p.artifact}${p.model ? ` (${p.model})` : ""}`);
      lines.push("");
      lines.push(`<details><summary>System prompt</summary>`);
      lines.push("");
      lines.push("```");
      lines.push(p.system);
      lines.push("```");
      lines.push("</details>");
      lines.push("");
      lines.push(`<details><summary>User prompt</summary>`);
      lines.push("");
      lines.push("```");
      lines.push(p.user);
      lines.push("```");
      lines.push("</details>");
      lines.push("");
    }
    hr();
  }
}

// ── Ending Arcs ─────────────────────────────────────────────────────────────
if (data.endingArcs?.length) {
  lines.push(`# Ending Arcs`);
  lines.push("");
  for (const arc of data.endingArcs) {
    const spectrumLine = arc.spectrum
      .map((s: string, i: number) => i === arc.result ? `**[${s}]**` : s)
      .join(" → ");
    lines.push(`## ${arc.label}`);
    lines.push(`Result: **${arc.spectrum[arc.result]}**`);
    lines.push("");
    if (arc.narrative) {
      lines.push(arc.narrative);
      lines.push("");
    }
    lines.push(`Spectrum: ${spectrumLine}`);
    lines.push("");
  }
  hr();
}

// ── Final State ─────────────────────────────────────────────────────────────
if (data.finalState && data.initialState) {
  lines.push(`# Final State`);
  lines.push("");
  lines.push("| Variable | Initial | Final | Delta |");
  lines.push("|----------|---------|-------|-------|");
  for (const k of Object.keys(data.initialState)) {
    const initial = data.initialState[k];
    const final = data.finalState[k];
    const delta = final - initial;
    if (delta === 0) continue;
    const sign = delta > 0 ? "+" : "";
    lines.push(`| ${k} | ${fmt(initial)} | ${fmt(final)} | ${sign}${fmt(delta)} |`);
  }
  lines.push("");
  hr();
}

// ── Story Bible ─────────────────────────────────────────────────────────────
if (data.storyBible) {
  const sb = data.storyBible;
  lines.push(`# Story Bible`);
  lines.push("");

  if (sb.toneShift) {
    lines.push(`**Tone:** ${sb.toneShift}`);
    lines.push("");
  }

  if (sb.activeThreads?.length) {
    lines.push(`## Active Threads`);
    lines.push("");
    for (const t of sb.activeThreads) {
      lines.push(`- ${t}`);
    }
    lines.push("");
  }

  if (sb.events?.length) {
    lines.push(`## Events (${sb.events.length})`);
    lines.push("");
    for (const ev of sb.events) {
      const weight = ev.narrativeWeight === "major" ? "MAJOR" : "minor";
      lines.push(`- **[${weight}]** R${ev.round} ${ev.phase}: ${ev.summary}`);
      if (ev.stateImpact) lines.push(`  ${ev.stateImpact}`);
    }
    lines.push("");
  }
  hr();
}

const outName = basename(inputPath, ".json") + "-prose.md";
const outPath = inputPath.replace(/[^/]+$/, outName);
writeFileSync(outPath, lines.join("\n"));
console.log(`Wrote ${lines.length} lines to ${outPath}`);
