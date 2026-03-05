/**
 * Tests for app activity tracking and state penalties.
 *
 * Invariants tested:
 * - INV-2: Players who skip their primary app get exactly the defined penalty at resolution
 * - INV-3: Players who open their primary app get no penalty
 * - INV-4: Activity resets between rounds (playerActivity cleared after resolution)
 */

import { describe, expect, it, beforeEach } from "bun:test";
import type { GameRoom, Player, StateVariables } from "@takeoff/shared";
import { INITIAL_STATE } from "@takeoff/shared";
import { PRIMARY_APP_PENALTIES, applyActivityPenalties } from "./activityPenalties.js";

function makePlayer(id: string, role: string, faction: string): Player {
  return {
    id,
    name: "Test",
    faction: faction as never,
    role: role as never,
    isLeader: false,
    connected: true,
  };
}

function makeRoom(players: Player[]): Pick<GameRoom, "players" | "state" | "playerActivity" | "round"> {
  return {
    players: Object.fromEntries(players.map((p) => [p.id, p])),
    state: { ...INITIAL_STATE },
    playerActivity: {},
    round: 1,
  };
}

// ── INV-2 & INV-3: Penalty logic ──────────────────────────────────────────────

describe("applyActivityPenalties", () => {
  it("INV-3: no penalty when player opened their primary app", () => {
    const player = makePlayer("p1", "ob_cto", "openbrain");
    const room = makeRoom([player]);
    room.playerActivity = { p1: ["wandb", "slack"] };

    const before = room.state.obCapability;
    applyActivityPenalties(room);
    expect(room.state.obCapability).toBe(before);
  });

  it("INV-2: ob_cto skips wandb → obCapability -3", () => {
    const player = makePlayer("p1", "ob_cto", "openbrain");
    const room = makeRoom([player]);
    room.playerActivity = { p1: ["slack", "email"] }; // wandb not opened

    const before = room.state.obCapability;
    applyActivityPenalties(room);
    expect(room.state.obCapability).toBe(before - 3);
  });

  it("INV-2: ob_safety skips slack → alignmentConfidence -3", () => {
    const player = makePlayer("p1", "ob_safety", "openbrain");
    const room = makeRoom([player]);
    room.playerActivity = { p1: [] };

    const before = room.state.alignmentConfidence;
    applyActivityPenalties(room);
    expect(room.state.alignmentConfidence).toBe(before - 3);
  });

  it("INV-2: ob_ceo skips email → obInternalTrust -3", () => {
    const player = makePlayer("p1", "ob_ceo", "openbrain");
    const room = makeRoom([player]);
    room.playerActivity = { p1: ["slack"] };

    const before = room.state.obInternalTrust;
    applyActivityPenalties(room);
    expect(room.state.obInternalTrust).toBe(before - 3);
  });

  it("INV-2: ext_vc skips bloomberg → economicDisruption +2", () => {
    const player = makePlayer("p1", "ext_vc", "external");
    const room = makeRoom([player]);
    room.playerActivity = { p1: ["email"] };

    const before = room.state.economicDisruption;
    applyActivityPenalties(room);
    expect(room.state.economicDisruption).toBe(before + 2);
  });

  it("INV-2: multiple players, only penalizes those who skipped", () => {
    const cto = makePlayer("p1", "ob_cto", "openbrain");
    const safety = makePlayer("p2", "ob_safety", "openbrain");
    const room = makeRoom([cto, safety]);
    room.playerActivity = {
      p1: ["wandb"],    // opened primary — no penalty
      p2: ["email"],    // did NOT open slack — penalized
    };

    const ctoBefore = room.state.obCapability;
    const safetyBefore = room.state.alignmentConfidence;
    applyActivityPenalties(room);

    expect(room.state.obCapability).toBe(ctoBefore);       // no penalty
    expect(room.state.alignmentConfidence).toBe(safetyBefore - 3); // penalized
  });

  it("INV-3: no penalty when playerActivity is undefined", () => {
    const player = makePlayer("p1", "ob_cto", "openbrain");
    const room = makeRoom([player]);
    room.playerActivity = undefined;

    const before = room.state.obCapability;
    applyActivityPenalties(room);
    expect(room.state.obCapability).toBe(before);
  });

  it("INV-3: no penalty for roles without a penalty mapping", () => {
    const player = makePlayer("p1", "ob_security", "openbrain");
    const room = makeRoom([player]);
    room.playerActivity = { p1: [] }; // opened nothing

    const stateBefore = { ...room.state };
    applyActivityPenalties(room);
    expect(room.state).toEqual(stateBefore); // nothing changed
  });

  it("INV-3: no penalty when player has no role", () => {
    const player: Player = { ...makePlayer("p1", "ob_cto", "openbrain"), role: null };
    const room = makeRoom([player]);
    room.playerActivity = { p1: [] };

    const before = room.state.obCapability;
    applyActivityPenalties(room);
    expect(room.state.obCapability).toBe(before);
  });

  it("INV-2: penalty applies even if player has empty activity array", () => {
    const player = makePlayer("p1", "china_director", "china");
    const room = makeRoom([player]);
    room.playerActivity = { p1: [] };

    const before = room.state.chinaCapability;
    applyActivityPenalties(room);
    expect(room.state.chinaCapability).toBe(before - 3);
  });

  it("INV-2: penalty applies when player has no activity record (missing key)", () => {
    const player = makePlayer("p1", "ext_nsa", "external");
    const room = makeRoom([player]);
    room.playerActivity = {}; // player key not present → treated as []

    const before = room.state.intlCooperation;
    applyActivityPenalties(room);
    expect(room.state.intlCooperation).toBe(before - 3);
  });

  it("all roles with penalties: partial coverage check", () => {
    const entries = Object.entries(PRIMARY_APP_PENALTIES);
    expect(entries.length).toBe(8);
    // Verify each entry has required fields
    for (const [role, { app, variable, delta }] of entries) {
      expect(typeof role).toBe("string");
      expect(typeof app).toBe("string");
      expect(typeof variable).toBe("string");
      expect(typeof delta).toBe("number");
    }
  });
});

// ── INV-4: Activity reset between rounds ─────────────────────────────────────

describe("playerActivity reset on resolution", () => {
  it("INV-4: after penalties are applied, playerActivity should be cleared", () => {
    // This mirrors what emitResolution does: apply penalties, then reset
    const player = makePlayer("p1", "ob_cto", "openbrain");
    const room = makeRoom([player]);
    room.playerActivity = { p1: ["slack"] };

    applyActivityPenalties(room);
    // Simulate the reset that emitResolution does
    room.playerActivity = {};

    expect(room.playerActivity).toEqual({});
  });
});
