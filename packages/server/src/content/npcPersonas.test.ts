/**
 * Tests for npcPersonas.ts
 *
 * Invariants tested:
 * - INV-1: getNpcPersona lookup function works correctly.
 * - INV-2: Faction visibility rules — cross-faction and faction-restricted personas.
 */

import { describe, expect, it } from "bun:test";
import { NPC_PERSONAS, getNpcPersona } from "./npcPersonas.js";

describe("getNpcPersona (INV-1)", () => {
  it("INV-1: round-trips every persona id", () => {
    for (const persona of NPC_PERSONAS) {
      const found = getNpcPersona(persona.id);
      expect(found).toBe(persona); // same object reference
    }
  });
});

describe("Cross-faction personas (INV-2)", () => {
  it("INV-2: Anonymous Source is visible to openbrain, prometheus, external, and china", () => {
    const persona = getNpcPersona("__npc_anon__")!;
    expect(persona.factions).toContain("openbrain");
    expect(persona.factions).toContain("prometheus");
    expect(persona.factions).toContain("external");
    expect(persona.factions).toContain("china");
  });

  it("INV-2: Policy Insider is visible to openbrain, prometheus, external, and china", () => {
    const persona = getNpcPersona("__npc_insider__")!;
    expect(persona.factions).toContain("openbrain");
    expect(persona.factions).toContain("prometheus");
    expect(persona.factions).toContain("external");
    expect(persona.factions).toContain("china");
  });
});

describe("Faction-specific personas (INV-2)", () => {
  it("INV-2: OpenBrain personas are restricted to openbrain", () => {
    const obPersonas = ["__npc_ob_engineer__", "__npc_ob_board__", "__npc_ob_security__"];
    for (const id of obPersonas) {
      const persona = getNpcPersona(id)!;
      expect(persona.factions).toEqual(["openbrain"]);
    }
  });

  it("INV-2: Prometheus personas are restricted to prometheus", () => {
    const promPersonas = ["__npc_prom_researcher__", "__npc_prom_os__"];
    for (const id of promPersonas) {
      const persona = getNpcPersona(id)!;
      expect(persona.factions).toEqual(["prometheus"]);
    }
  });

  it("INV-2: China personas are restricted to china", () => {
    const chinaPersonas = ["__npc_china_liaison__", "__npc_china_engineer__"];
    for (const id of chinaPersonas) {
      const persona = getNpcPersona(id)!;
      expect(persona.factions).toEqual(["china"]);
    }
  });

  it("INV-2: External personas are restricted to external", () => {
    const extPersonas = ["__npc_intel_analyst__", "__npc_portfolio_ceo__", "__npc_whistleblower__"];
    for (const id of extPersonas) {
      const persona = getNpcPersona(id)!;
      expect(persona.factions).toEqual(["external"]);
    }
  });
});
