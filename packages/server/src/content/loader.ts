import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { AppContent, Faction, Role, RoundContent, StateVariables } from "@takeoff/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUNDS_DIR = join(__dirname, "rounds");

// Cache parsed round content in memory
const roundCache = new Map<number, RoundContent>();

export function loadRound(round: number): RoundContent {
  if (roundCache.has(round)) {
    return roundCache.get(round)!;
  }

  const filePath = join(ROUNDS_DIR, `round${round}.json`);
  const raw = readFileSync(filePath, "utf-8");
  const content = JSON.parse(raw) as RoundContent;
  roundCache.set(round, content);
  return content;
}

function evaluateCondition(condition: NonNullable<AppContent["items"][number]["condition"]>, state: StateVariables): boolean {
  const value = state[condition.variable];
  switch (condition.operator) {
    case "gt": return value > condition.value;
    case "lt": return value < condition.value;
    case "eq": return value === condition.value;
    default: return true;
  }
}

/**
 * Load and filter content for a specific player.
 *
 * INV-1: Only content matching the player's faction is returned.
 * INV-2: Role-specific app blocks (with a `role` field) are only returned when the player's role matches.
 * INV-3: Items whose condition evaluates to false against the current state are excluded.
 */
export function getContentForPlayer(
  round: number,
  faction: Faction,
  role: Role,
  state: StateVariables,
): AppContent[] {
  const roundContent = loadRound(round);

  const result: AppContent[] = [];

  for (const appContent of roundContent.apps) {
    // INV-1: faction filter
    if (appContent.faction !== faction) continue;

    // INV-2: role filter (only applies when appContent has a role)
    if (appContent.role !== undefined && appContent.role !== role) continue;

    // Filter items by condition (INV-3)
    const filteredItems = appContent.items.filter((item) => {
      if (!item.condition) return true;
      return evaluateCondition(item.condition, state);
    });

    if (filteredItems.length === 0) continue;

    result.push({ ...appContent, items: filteredItems });
  }

  return result;
}
