/**
 * Tests for npcPersonas.ts
 *
 * Invariants tested:
 * - INV-1: All persona IDs follow the __npc_*__ convention and are unique.
 * - INV-2: NPC_IDS mirrors NPC_PERSONAS exactly (no missing/extra entries).
 * - INV-3: getNpcPersona returns the correct persona for valid IDs and undefined for unknown.
 * - INV-4: Cross-faction personas cover at least openbrain, prometheus, and external.
 * - INV-5: Faction-specific personas are restricted to their declared faction.
 */

import { describe, expect, it } from "bun:test";
import { NPC_PERSONAS, NPC_IDS, getNpcPersona } from "./npcPersonas.js";

describe("NPC_PERSONAS shape (INV-1)", () => {
  it("INV-1: all IDs start with __npc_ and end with __", () => {
    for (const persona of NPC_PERSONAS) {
      expect(persona.id).toMatch(/^__npc_.+__$/);
    }
  });

  it("INV-1: all IDs are unique", () => {
    const ids = NPC_PERSONAS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("INV-1: every persona has a non-empty name, subtitle, and avatarColor", () => {
    for (const persona of NPC_PERSONAS) {
      expect(persona.name.length).toBeGreaterThan(0);
      expect(persona.subtitle.length).toBeGreaterThan(0);
      expect(persona.avatarColor.length).toBeGreaterThan(0);
    }
  });

  it("INV-1: every persona has a non-empty factions array", () => {
    for (const persona of NPC_PERSONAS) {
      expect(persona.factions.length).toBeGreaterThan(0);
    }
  });

  it("INV-1: avatarColor values start with 'bg-'", () => {
    for (const persona of NPC_PERSONAS) {
      expect(persona.avatarColor).toMatch(/^bg-/);
    }
  });
});

describe("NPC_IDS mirror (INV-2)", () => {
  it("INV-2: NPC_IDS has the same count as NPC_PERSONAS", () => {
    expect(NPC_IDS.size).toBe(NPC_PERSONAS.length);
  });

  it("INV-2: every NPC_PERSONAS id is in NPC_IDS", () => {
    for (const persona of NPC_PERSONAS) {
      expect(NPC_IDS.has(persona.id)).toBe(true);
    }
  });

  it("INV-2: NPC_IDS contains no IDs absent from NPC_PERSONAS", () => {
    const personaIds = new Set(NPC_PERSONAS.map((p) => p.id));
    for (const id of NPC_IDS) {
      expect(personaIds.has(id)).toBe(true);
    }
  });
});

describe("getNpcPersona (INV-3)", () => {
  it("INV-3: returns the correct persona for a valid ID", () => {
    const persona = getNpcPersona("__npc_anon__");
    expect(persona).toBeDefined();
    expect(persona?.name).toBe("Anonymous Source");
  });

  it("INV-3: returns undefined for an unknown ID", () => {
    expect(getNpcPersona("__npc_unknown__")).toBeUndefined();
    expect(getNpcPersona("")).toBeUndefined();
    expect(getNpcPersona("anon_source")).toBeUndefined();
  });

  it("INV-3: round-trips every persona id", () => {
    for (const persona of NPC_PERSONAS) {
      const found = getNpcPersona(persona.id);
      expect(found).toBe(persona); // same object reference
    }
  });
});

describe("Cross-faction personas (INV-4)", () => {
  it("INV-4: Anonymous Source is visible to openbrain, prometheus, external, and china", () => {
    const persona = getNpcPersona("__npc_anon__")!;
    expect(persona.factions).toContain("openbrain");
    expect(persona.factions).toContain("prometheus");
    expect(persona.factions).toContain("external");
    expect(persona.factions).toContain("china");
  });

  it("INV-4: Policy Insider is visible to openbrain, prometheus, external, and china", () => {
    const persona = getNpcPersona("__npc_insider__")!;
    expect(persona.factions).toContain("openbrain");
    expect(persona.factions).toContain("prometheus");
    expect(persona.factions).toContain("external");
    expect(persona.factions).toContain("china");
  });
});

describe("Faction-specific personas (INV-5)", () => {
  it("INV-5: OpenBrain personas are restricted to openbrain", () => {
    const obPersonas = ["__npc_ob_engineer__", "__npc_ob_board__", "__npc_ob_security__"];
    for (const id of obPersonas) {
      const persona = getNpcPersona(id)!;
      expect(persona.factions).toEqual(["openbrain"]);
    }
  });

  it("INV-5: Prometheus personas are restricted to prometheus", () => {
    const promPersonas = ["__npc_prom_researcher__", "__npc_prom_os__"];
    for (const id of promPersonas) {
      const persona = getNpcPersona(id)!;
      expect(persona.factions).toEqual(["prometheus"]);
    }
  });

  it("INV-5: China personas are restricted to china", () => {
    const chinaPersonas = ["__npc_china_liaison__", "__npc_china_engineer__"];
    for (const id of chinaPersonas) {
      const persona = getNpcPersona(id)!;
      expect(persona.factions).toEqual(["china"]);
    }
  });

  it("INV-5: External personas are restricted to external", () => {
    const extPersonas = ["__npc_intel_analyst__", "__npc_portfolio_ceo__", "__npc_whistleblower__"];
    for (const id of extPersonas) {
      const persona = getNpcPersona(id)!;
      expect(persona.factions).toEqual(["external"]);
    }
  });
});

describe("Persona count", () => {
  it("has at least 13 personas defined (grew after adding granular personal contacts)", () => {
    expect(NPC_PERSONAS.length).toBeGreaterThanOrEqual(13);
  });

  it("includes __npc_personal__ as fallback", () => {
    expect(NPC_IDS.has("__npc_personal__")).toBe(true);
  });

  it("includes all required granular personal personas", () => {
    const required = [
      "__npc_spouse__",
      "__npc_mom__",
      "__npc_dad__",
      "__npc_brother__",
      "__npc_sister__",
      "__npc_amazon__",
      "__npc_doordash__",
      "__npc_linkedin__",
      "__npc_discord__",
      "__npc_school__",
      "__npc_library__",
      "__npc_gym__",
      "__npc_recall__",
      "__npc_hackernews__",
      "__npc_comrades__",
    ];
    for (const id of required) {
      expect(NPC_IDS.has(id)).toBe(true);
    }
  });
});
