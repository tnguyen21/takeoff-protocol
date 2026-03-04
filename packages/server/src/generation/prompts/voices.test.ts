import { describe, it, expect } from "bun:test";
import { FACTION_VOICES, APP_VOICES } from "./voices.js";
import { ROUND_ARCS } from "./arcs.js";
import { CONTENT_SYSTEM_PROMPT } from "./system.js";
import { APP_TYPE_MAP } from "../content.js";
import type { Faction } from "@takeoff/shared";

// INV-1: FACTION_VOICES has entries for all 4 factions
describe("FACTION_VOICES", () => {
  const REQUIRED_FACTIONS: Faction[] = ["openbrain", "prometheus", "china", "external"];

  it("INV-1: has entries for all 4 factions", () => {
    for (const faction of REQUIRED_FACTIONS) {
      expect(FACTION_VOICES[faction]).toBeDefined();
      expect(typeof FACTION_VOICES[faction]).toBe("string");
      expect(FACTION_VOICES[faction].length).toBeGreaterThan(0);
    }
  });

  it("INV-1: has exactly 4 entries (no extra factions)", () => {
    expect(Object.keys(FACTION_VOICES)).toHaveLength(4);
  });
});

// INV-2: APP_VOICES has entries for required apps
describe("APP_VOICES", () => {
  const REQUIRED_APPS = ["slack", "news", "twitter", "bloomberg", "email", "memo", "signal", "intel"] as const;

  it("INV-2: has entries for all required apps", () => {
    for (const app of REQUIRED_APPS) {
      expect(APP_VOICES[app]).toBeDefined();
      expect(typeof APP_VOICES[app]).toBe("string");
      expect((APP_VOICES[app] as string).length).toBeGreaterThan(0);
    }
  });

  it("INV-1: every app in APP_TYPE_MAP has a corresponding entry in APP_VOICES", () => {
    for (const app of Object.keys(APP_TYPE_MAP)) {
      expect(APP_VOICES[app as keyof typeof APP_VOICES]).toBeDefined();
      expect(typeof APP_VOICES[app as keyof typeof APP_VOICES]).toBe("string");
    }
  });

  it("INV-3: no APP_VOICES entry is empty string", () => {
    for (const [app, voice] of Object.entries(APP_VOICES)) {
      expect(voice, `APP_VOICES["${app}"] must not be empty`).not.toBe("");
    }
  });
});

// INV-2 (CONTENT_SYSTEM_PROMPT): format reference for all 8 app types
describe("CONTENT_SYSTEM_PROMPT", () => {
  const REQUIRED_APP_TYPES = ["news", "twitter", "slack", "email", "memo", "signal", "intel", "bloomberg"];

  it('INV-2: contains format reference for all 8 app types', () => {
    for (const app of REQUIRED_APP_TYPES) {
      expect(CONTENT_SYSTEM_PROMPT).toContain(`"${app}"`);
    }
  });
});

// INV-3 & INV-4: ROUND_ARCS has entries for rounds 1-5, each with required fields
describe("ROUND_ARCS", () => {
  it("INV-3: has entries for rounds 1-5", () => {
    for (let round = 1; round <= 5; round++) {
      expect(ROUND_ARCS[round]).toBeDefined();
    }
  });

  it("INV-3: has no entries outside rounds 1-5", () => {
    const keys = Object.keys(ROUND_ARCS).map(Number);
    expect(keys.every(k => k >= 1 && k <= 5)).toBe(true);
    expect(keys).toHaveLength(5);
  });

  it("INV-4: each RoundArc has non-empty title, era, narrativeBeat", () => {
    for (let round = 1; round <= 5; round++) {
      const arc = ROUND_ARCS[round];
      expect(arc.round).toBe(round);
      expect(arc.title.length).toBeGreaterThan(0);
      expect(arc.era.length).toBeGreaterThan(0);
      expect(arc.narrativeBeat.length).toBeGreaterThan(0);
      expect(arc.escalation.length).toBeGreaterThan(0);
    }
  });

  it("INV-4: each RoundArc has keyTensions with at least 1 entry", () => {
    for (let round = 1; round <= 5; round++) {
      const arc = ROUND_ARCS[round];
      expect(Array.isArray(arc.keyTensions)).toBe(true);
      expect(arc.keyTensions.length).toBeGreaterThanOrEqual(1);
      for (const tension of arc.keyTensions) {
        expect(typeof tension).toBe("string");
        expect(tension.length).toBeGreaterThan(0);
      }
    }
  });
});
