/**
 * Migration script: Reads round0-5.json and generates TypeScript content modules
 * organized by faction/app. Run once, then delete this file.
 *
 * Usage: node _migrate.cjs
 */

const fs = require("fs");
const path = require("path");

const CONTENT_DIR = __dirname;
const ROUNDS_DIR = path.join(CONTENT_DIR, "rounds");

// Load all rounds
const rounds = [];
for (let i = 0; i <= 5; i++) {
  const filePath = path.join(ROUNDS_DIR, `round${i}.json`);
  rounds.push(JSON.parse(fs.readFileSync(filePath, "utf-8")));
}

// Accumulation rules per app
const ACCUMULATING_APPS = new Set([
  "slack", "email", "memo", "security", "intel", "military", "arxiv", "signal", "briefing",
]);

// Collect items by faction → app → role → items[]
// Also collect "gamestate" items for tutorial.ts
const factionData = {}; // faction → { app → { role|'__all__' → items[] } }
const tutorialGamestate = []; // gamestate items from round 0

for (const roundData of rounds) {
  const round = roundData.round;
  for (const appContent of roundData.apps) {
    const { faction, app, role, items } = appContent;

    // gamestate items from tutorial go to tutorial.ts
    if (app === "gamestate") {
      for (const item of items) {
        tutorialGamestate.push({ ...item, round });
      }
      continue;
    }

    if (!factionData[faction]) factionData[faction] = {};
    if (!factionData[faction][app]) factionData[faction][app] = {};

    const roleKey = role || "__all__";
    if (!factionData[faction][app][roleKey]) factionData[faction][app][roleKey] = [];

    for (const item of items) {
      factionData[faction][app][roleKey].push({ ...item, round });
    }
  }
}

// Helper: convert faction to directory name and constant prefix
const FACTION_DIR = {
  openbrain: "openbrain",
  prometheus: "prometheus",
  china: "china",
  external: "external",
};

const FACTION_PREFIX = {
  openbrain: "OB",
  prometheus: "PROM",
  china: "CHINA",
  external: "EXT",
};

// Helper: serialize a ContentItem to TypeScript
function serializeItem(item) {
  const lines = [];
  lines.push("    {");
  lines.push(`      id: ${JSON.stringify(item.id)},`);
  lines.push(`      type: ${JSON.stringify(item.type)},`);
  lines.push(`      round: ${item.round},`);
  if (item.sender) lines.push(`      sender: ${JSON.stringify(item.sender)},`);
  if (item.channel) lines.push(`      channel: ${JSON.stringify(item.channel)},`);
  if (item.subject) lines.push(`      subject: ${JSON.stringify(item.subject)},`);
  lines.push(`      body: ${JSON.stringify(item.body)},`);
  lines.push(`      timestamp: ${JSON.stringify(item.timestamp)},`);
  if (item.classification) lines.push(`      classification: ${JSON.stringify(item.classification)},`);
  if (item.condition) {
    lines.push(`      condition: { variable: ${JSON.stringify(item.condition.variable)}, operator: ${JSON.stringify(item.condition.operator)}, value: ${item.condition.value} },`);
  }
  lines.push("    },");
  return lines.join("\n");
}

// Generate files per faction
for (const [faction, apps] of Object.entries(factionData)) {
  const dir = path.join(CONTENT_DIR, FACTION_DIR[faction]);
  fs.mkdirSync(dir, { recursive: true });

  for (const [app, roles] of Object.entries(apps)) {
    const prefix = FACTION_PREFIX[faction];
    const appUpper = app.toUpperCase();
    const accumulate = ACCUMULATING_APPS.has(app);

    const lines = [];
    lines.push(`import type { ContentItem } from "@takeoff/shared";`);
    lines.push(`import { registerContent } from "../loader.js";`);
    lines.push("");

    const exportNames = [];

    for (const [roleKey, items] of Object.entries(roles)) {
      const isRoleScoped = roleKey !== "__all__";
      const roleSuffix = isRoleScoped ? `_${roleKey.toUpperCase().replace(/^(OB_|PROM_|CHINA_|EXT_)/, "")}` : "";
      const constName = `${prefix}_${appUpper}${roleSuffix}`;
      exportNames.push({ constName, roleKey, isRoleScoped });

      lines.push(`export const ${constName}: ContentItem[] = [`);
      // Sort items by round, then by timestamp
      items.sort((a, b) => a.round - b.round || a.timestamp.localeCompare(b.timestamp));
      for (const item of items) {
        lines.push(serializeItem(item));
      }
      lines.push(`];`);
      lines.push("");
    }

    // Register all content modules
    for (const { constName, roleKey, isRoleScoped } of exportNames) {
      const roleArg = isRoleScoped ? `, role: ${JSON.stringify(roleKey)}` : "";
      lines.push(`registerContent({ faction: ${JSON.stringify(faction)}, app: ${JSON.stringify(app)}${roleArg}, accumulate: ${accumulate}, items: ${constName} });`);
    }
    lines.push("");

    const filePath = path.join(dir, `${app}.ts`);
    fs.writeFileSync(filePath, lines.join("\n"));
    console.log(`Generated: ${FACTION_DIR[faction]}/${app}.ts (${Object.values(roles).flat().length} items)`);
  }
}

// Generate tutorial.ts for gamestate items
{
  const lines = [];
  lines.push(`import type { ContentItem } from "@takeoff/shared";`);
  lines.push(`import { registerContent } from "./loader.js";`);
  lines.push("");

  // Group by faction
  const byFaction = {};
  for (const item of tutorialGamestate) {
    // Extract faction from item ID pattern: tut-{faction}-state-*
    const idParts = item.id.split("-");
    let faction;
    if (idParts[1] === "ob") faction = "openbrain";
    else if (idParts[1] === "prom") faction = "prometheus";
    else if (idParts[1] === "china") faction = "china";
    else if (idParts[1] === "ext") faction = "external";
    else {
      console.warn(`Unknown faction in gamestate item: ${item.id}`);
      continue;
    }
    if (!byFaction[faction]) byFaction[faction] = [];
    byFaction[faction].push(item);
  }

  for (const [faction, items] of Object.entries(byFaction)) {
    const prefix = FACTION_PREFIX[faction];
    const constName = `${prefix}_GAMESTATE`;
    lines.push(`export const ${constName}: ContentItem[] = [`);
    for (const item of items) {
      lines.push(serializeItem(item));
    }
    lines.push(`];`);
    lines.push("");
    lines.push(`registerContent({ faction: ${JSON.stringify(faction)}, app: "gamestate", accumulate: false, items: ${constName} });`);
    lines.push("");
  }

  const filePath = path.join(CONTENT_DIR, "tutorial.ts");
  fs.writeFileSync(filePath, lines.join("\n"));
  console.log(`Generated: tutorial.ts (${tutorialGamestate.length} items)`);
}

console.log("\nDone! Now create index.ts to import all modules.");
