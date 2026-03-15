import type { AppContent, AppId, ContentItem, Faction, Role, StateVariables } from "@takeoff/shared";

// ── Content Module Registry ──

export interface ContentModule {
  faction: Faction;
  app: AppId;
  role?: Role;
  accumulate: boolean; // true = show rounds 0..N, false = show only round N
  items: ContentItem[];
}

const registry: ContentModule[] = [];

export function registerContent(mod: ContentModule): void {
  registry.push(mod);
}

/** @internal Test-only: snapshot the registry for restore. */
export function _snapshotRegistry(): ContentModule[] {
  return [...registry];
}

/** @internal Test-only: replace the registry contents. */
export function _restoreRegistry(snapshot: ContentModule[]): void {
  registry.length = 0;
  registry.push(...snapshot);
}

// ── Condition evaluation (unchanged) ──

function evaluateCondition(condition: NonNullable<ContentItem["condition"]>, state: StateVariables): boolean {
  const value = state[condition.variable];
  switch (condition.operator) {
    case "gt":
      return value > condition.value;
    case "lt":
      return value < condition.value;
    case "eq":
      return value === condition.value;
    default:
      return true;
  }
}

// ── Accumulating vs fresh apps ──

const ACCUMULATING_APPS: Set<AppId> = new Set([
  "slack",
  "email",
  "memo",
  "security",
  "intel",
  "military",
  "arxiv",
  "signal",
  "briefing", // NSA docs
]);

// Everything else (news, wandb, bloomberg, compute, twitter, gamestate) is fresh

/**
 * Load and filter content for a specific player.
 *
 * INV-1: Only content matching the player's faction is returned.
 * INV-2: Role-specific modules (with a `role` field) are only returned when the player's role matches.
 * INV-3: Items whose condition evaluates to false against the current state are excluded.
 * INV-4: Accumulating apps return items from rounds 0..N; fresh apps return only round N.
 */
export function getContentForPlayer(round: number, faction: Faction, role: Role, state: StateVariables): AppContent[] {
  // Map from AppId to merged AppContent — deduplicates multiple registrations for the same app.
  const appMap = new Map<AppId, AppContent>();

  for (const mod of registry) {
    // INV-1: faction filter
    if (mod.faction !== faction) continue;

    // INV-2: role filter
    if (mod.role !== undefined && mod.role !== role) continue;

    // Round filter: accumulating apps show history, fresh apps show current only
    const accumulate = mod.accumulate || ACCUMULATING_APPS.has(mod.app);
    const roundItems = mod.items.filter((item) => (accumulate ? item.round <= round : item.round === round));

    // INV-3: condition filter
    const filteredItems = roundItems.filter((item) => {
      if (!item.condition) return true;
      return evaluateCondition(item.condition, state);
    });

    if (filteredItems.length === 0) continue;

    const existing = appMap.get(mod.app);
    if (existing) {
      // Merge items from this registration into the existing entry, deduplicating by id.
      const seenIds = new Set(existing.items.map((i) => i.id));
      for (const item of filteredItems) {
        if (!seenIds.has(item.id)) {
          existing.items.push(item);
          seenIds.add(item.id);
        }
      }
    } else {
      appMap.set(mod.app, {
        faction: mod.faction,
        role: mod.role,
        app: mod.app,
        items: [...filteredItems],
      });
    }
  }

  return Array.from(appMap.values());
}
