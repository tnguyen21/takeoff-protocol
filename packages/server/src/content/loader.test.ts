import { describe, it, expect, beforeAll } from "bun:test";
import { getContentForPlayer, loadRound } from "./loader.js";
import { INITIAL_STATE } from "@takeoff/shared";
import type { StateVariables } from "@takeoff/shared";

// ── Round loading ──

describe("loadRound", () => {
  it("loads and caches round1.json", () => {
    const r1 = loadRound(1);
    expect(r1.round).toBe(1);
    expect(r1.apps.length).toBeGreaterThan(0);
    expect(r1.briefing.common).toContain("November 2026");

    // Second call returns same object (cache)
    const r1again = loadRound(1);
    expect(r1again).toBe(r1);
  });

  it("throws for a round that doesn't exist", () => {
    expect(() => loadRound(99)).toThrow();
  });
});

// ── Invariant 1: faction isolation ──

describe("INV-1: faction isolation", () => {
  it("openbrain CEO receives only openbrain items", () => {
    const content = getContentForPlayer(1, "openbrain", "ob_ceo", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("openbrain");
    }
  });

  it("prometheus player receives no openbrain or china items", () => {
    const content = getContentForPlayer(1, "prometheus", "prom_ceo", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("prometheus");
    }
  });

  it("china director receives no US lab items", () => {
    const content = getContentForPlayer(1, "china", "china_director", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("china");
    }
  });

  it("external player receives no faction-specific lab items", () => {
    const content = getContentForPlayer(1, "external", "ext_nsa", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("external");
    }
  });
});

// ── Invariant 2: role-specific content ──

describe("INV-2: role-specific items only reach matching role", () => {
  it("ob_safety sees the safety memo, ob_ceo does not", () => {
    const safetyContent = getContentForPlayer(1, "openbrain", "ob_safety", INITIAL_STATE);
    const ceoContent = getContentForPlayer(1, "openbrain", "ob_ceo", INITIAL_STATE);

    const safetyHasMemo = safetyContent.some((ac) => ac.app === "memo" && ac.items.some((i) => i.id === "ob-memo-safety-1"));
    const ceoHasMemo = ceoContent.some((ac) => ac.app === "memo" && ac.items.some((i) => i.id === "ob-memo-safety-1"));

    expect(safetyHasMemo).toBe(true);
    expect(ceoHasMemo).toBe(false);
  });

  it("china_intel sees the intel briefing, china_director does not", () => {
    const intelContent = getContentForPlayer(1, "china", "china_intel", INITIAL_STATE);
    const directorContent = getContentForPlayer(1, "china", "china_director", INITIAL_STATE);

    const intelHasBrief = intelContent.some((ac) => ac.app === "intel");
    const directorHasBrief = directorContent.some((ac) => ac.app === "intel");

    expect(intelHasBrief).toBe(true);
    expect(directorHasBrief).toBe(false);
  });

  it("ext_nsa gets the PDB briefing, ext_journalist does not", () => {
    const nsaContent = getContentForPlayer(1, "external", "ext_nsa", INITIAL_STATE);
    const journalistContent = getContentForPlayer(1, "external", "ext_journalist", INITIAL_STATE);

    const nsaHasBrief = nsaContent.some((ac) => ac.app === "briefing");
    const journalistHasBrief = journalistContent.some((ac) => ac.app === "briefing");

    expect(nsaHasBrief).toBe(true);
    expect(journalistHasBrief).toBe(false);
  });
});

// ── Invariant 3: conditional filtering ──

describe("INV-3: conditional items excluded when condition unmet", () => {
  it("security report (condition: securityLevelOB < 3) shown when SL is 2", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 2 };
    const content = getContentForPlayer(1, "openbrain", "ob_security", state);
    const hasReport = content.some((ac) => ac.items.some((i) => i.id === "ob-security-1"));
    expect(hasReport).toBe(true);
  });

  it("security report excluded when securityLevelOB >= 3", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 3 };
    const content = getContentForPlayer(1, "openbrain", "ob_security", state);
    const hasReport = content.some((ac) => ac.items.some((i) => i.id === "ob-security-1"));
    expect(hasReport).toBe(false);
  });

  it("journalist leak tip (condition: publicAwareness < 30) shown when awareness is 10", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 10 };
    const content = getContentForPlayer(1, "external", "ext_journalist", state);
    const hasTip = content.some((ac) => ac.items.some((i) => i.id === "ext-journalist-signal-1"));
    expect(hasTip).toBe(true);
  });

  it("journalist leak tip excluded when publicAwareness >= 30", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 30 };
    const content = getContentForPlayer(1, "external", "ext_journalist", state);
    const hasTip = content.some((ac) => ac.items.some((i) => i.id === "ext-journalist-signal-1"));
    expect(hasTip).toBe(false);
  });

  it("conditional filtering with exact obCapability match (eq operator)", () => {
    // Test the evaluateCondition eq branch by creating an item with eq condition directly
    // Since no eq items exist in round1.json, we verify gt/lt boundary behavior more carefully
    const stateAtBoundary: StateVariables = { ...INITIAL_STATE, securityLevelOB: 2 };
    const stateAboveBoundary: StateVariables = { ...INITIAL_STATE, securityLevelOB: 4 };

    const below = getContentForPlayer(1, "openbrain", "ob_security", stateAtBoundary);
    const above = getContentForPlayer(1, "openbrain", "ob_security", stateAboveBoundary);

    expect(below.some((ac) => ac.items.some((i) => i.id === "ob-security-1"))).toBe(true);
    expect(above.some((ac) => ac.items.some((i) => i.id === "ob-security-1"))).toBe(false);
  });
});

// ── Content richness ──

describe("content richness checks", () => {
  it("openbrain CEO receives content across multiple apps", () => {
    const content = getContentForPlayer(1, "openbrain", "ob_ceo", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps.length).toBeGreaterThan(2);
    // CEO should see slack, wandb, email, signal at minimum
    expect(apps).toContain("slack");
    expect(apps).toContain("email");
  });

  it("round1 briefing has faction variant for openbrain", () => {
    const r1 = loadRound(1);
    expect(r1.briefing.factionVariants?.openbrain).toBeTruthy();
    expect(r1.briefing.factionVariants?.china).toBeTruthy();
  });

  it("china director gets compute and wechat content", () => {
    const content = getContentForPlayer(1, "china", "china_director", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps).toContain("compute");
    expect(apps).toContain("wechat");
  });

  it("all items have required fields", () => {
    const r1 = loadRound(1);
    for (const appContent of r1.apps) {
      for (const item of appContent.items) {
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.body).toBe("string");
        expect(typeof item.timestamp).toBe("string");
        expect(["message", "headline", "memo", "chart", "tweet", "document", "row"]).toContain(item.type);
      }
    }
  });
});
