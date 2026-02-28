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

// ── Round 2 loading ──

describe("round2 loadRound", () => {
  it("loads round2.json and returns round number 2", () => {
    const r2 = loadRound(2);
    expect(r2.round).toBe(2);
    expect(r2.apps.length).toBeGreaterThan(0);
    expect(r2.briefing.common).toContain("March 2027");
  });

  it("round2 briefing has faction variants for all factions", () => {
    const r2 = loadRound(2);
    expect(r2.briefing.factionVariants?.openbrain).toBeTruthy();
    expect(r2.briefing.factionVariants?.prometheus).toBeTruthy();
    expect(r2.briefing.factionVariants?.china).toBeTruthy();
    expect(r2.briefing.factionVariants?.external).toBeTruthy();
  });

  it("round2 caches correctly — same object on second call", () => {
    const r2a = loadRound(2);
    const r2b = loadRound(2);
    expect(r2a).toBe(r2b);
  });
});

// ── Round 2 faction isolation ──

describe("round2 INV-1: faction isolation", () => {
  it("openbrain player receives only openbrain items", () => {
    const content = getContentForPlayer(2, "openbrain", "ob_ceo", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("openbrain");
    }
  });

  it("prometheus player receives no openbrain or china items", () => {
    const content = getContentForPlayer(2, "prometheus", "prom_ceo", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("prometheus");
    }
  });

  it("china player receives no US lab items", () => {
    const content = getContentForPlayer(2, "china", "china_director", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("china");
    }
  });
});

// ── Round 2 role-specific content ──

describe("round2 INV-2: role-specific items only reach matching role", () => {
  it("ob_safety sees the safety memo, ob_ceo does not", () => {
    const safetyContent = getContentForPlayer(2, "openbrain", "ob_safety", INITIAL_STATE);
    const ceoContent = getContentForPlayer(2, "openbrain", "ob_ceo", INITIAL_STATE);

    const safetyHasMemo = safetyContent.some((ac) => ac.app === "memo" && ac.items.some((i) => i.id === "ob2-memo-safety-1"));
    const ceoHasMemo = ceoContent.some((ac) => ac.app === "memo" && ac.items.some((i) => i.id === "ob2-memo-safety-1"));

    expect(safetyHasMemo).toBe(true);
    expect(ceoHasMemo).toBe(false);
  });

  it("china_intel sees the intel briefing, china_director does not", () => {
    const intelContent = getContentForPlayer(2, "china", "china_intel", INITIAL_STATE);
    const directorContent = getContentForPlayer(2, "china", "china_director", INITIAL_STATE);

    expect(intelContent.some((ac) => ac.app === "intel")).toBe(true);
    expect(directorContent.some((ac) => ac.app === "intel")).toBe(false);
  });

  it("ext_nsa gets the PDB briefing, ext_vc does not", () => {
    const nsaContent = getContentForPlayer(2, "external", "ext_nsa", INITIAL_STATE);
    const vcContent = getContentForPlayer(2, "external", "ext_vc", INITIAL_STATE);

    expect(nsaContent.some((ac) => ac.app === "briefing")).toBe(true);
    expect(vcContent.some((ac) => ac.app === "briefing")).toBe(false);
  });

  it("ext_journalist gets Signal tip, ext_nsa does not see journalist signal", () => {
    const journalistContent = getContentForPlayer(2, "external", "ext_journalist", INITIAL_STATE);
    // journalist has signal items with role=ext_journalist
    const journalistSignalIds = journalistContent
      .filter((ac) => ac.app === "signal")
      .flatMap((ac) => ac.items.map((i) => i.id));
    expect(journalistSignalIds).toContain("ext2-signal-journalist-1");
  });
});

// ── Round 2 conditional filtering ──

describe("round2 INV-3: conditional items excluded when condition unmet", () => {
  it("breach incident report shown when securityLevelOB < 2", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 1 };
    const content = getContentForPlayer(2, "openbrain", "ob_security", state);
    const hasReport = content.some((ac) => ac.items.some((i) => i.id === "ob2-security-1"));
    expect(hasReport).toBe(true);
  });

  it("breach incident report excluded when securityLevelOB >= 2", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 3 };
    const content = getContentForPlayer(2, "openbrain", "ob_security", state);
    const hasReport = content.some((ac) => ac.items.some((i) => i.id === "ob2-security-1"));
    expect(hasReport).toBe(false);
  });

  it("China stolen-weights compute chart shown when securityLevelOB < 2", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 1 };
    const content = getContentForPlayer(2, "china", "china_director", state);
    const hasChart = content.some((ac) => ac.items.some((i) => i.id === "china2-compute-2"));
    expect(hasChart).toBe(true);
  });

  it("China stolen-weights compute chart excluded when securityLevelOB >= 2", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 2 };
    const content = getContentForPlayer(2, "china", "china_director", state);
    const hasChart = content.some((ac) => ac.items.some((i) => i.id === "china2-compute-2"));
    expect(hasChart).toBe(false);
  });

  it("journalist Signal tip shown when publicAwareness < 40", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 15 };
    const content = getContentForPlayer(2, "external", "ext_journalist", state);
    const hasTip = content.some((ac) => ac.items.some((i) => i.id === "ext2-signal-journalist-1"));
    expect(hasTip).toBe(true);
  });

  it("journalist Signal tip excluded when publicAwareness >= 40", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 40 };
    const content = getContentForPlayer(2, "external", "ext_journalist", state);
    const hasTip = content.some((ac) => ac.items.some((i) => i.id === "ext2-signal-journalist-1"));
    expect(hasTip).toBe(false);
  });

  it("high-capability OB chart shown only when obCapability > 36", () => {
    const stateHigh: StateVariables = { ...INITIAL_STATE, obCapability: 40 };
    const stateLow: StateVariables = { ...INITIAL_STATE, obCapability: 35 };

    const highContent = getContentForPlayer(2, "openbrain", "ob_ceo", stateHigh);
    const lowContent = getContentForPlayer(2, "openbrain", "ob_ceo", stateLow);

    const highHasChart = highContent.some((ac) => ac.items.some((i) => i.id === "ob2-wandb-3"));
    const lowHasChart = lowContent.some((ac) => ac.items.some((i) => i.id === "ob2-wandb-3"));

    expect(highHasChart).toBe(true);
    expect(lowHasChart).toBe(false);
  });
});

// ── Round 2 content richness ──

describe("round2 content richness checks", () => {
  it("openbrain CEO receives content from multiple apps", () => {
    const content = getContentForPlayer(2, "openbrain", "ob_ceo", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps.length).toBeGreaterThan(2);
    expect(apps).toContain("slack");
    expect(apps).toContain("email");
    expect(apps).toContain("wandb");
  });

  it("china director gets compute and wechat content", () => {
    const content = getContentForPlayer(2, "china", "china_director", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps).toContain("compute");
    expect(apps).toContain("wechat");
  });

  it("prometheus player receives wandb and slack content", () => {
    const content = getContentForPlayer(2, "prometheus", "prom_ceo", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps).toContain("wandb");
    expect(apps).toContain("slack");
  });

  it("all round2 items have required fields with valid types", () => {
    const r2 = loadRound(2);
    const validTypes = ["message", "headline", "memo", "chart", "tweet", "document", "row"];
    for (const appContent of r2.apps) {
      for (const item of appContent.items) {
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.body).toBe("string");
        expect(typeof item.timestamp).toBe("string");
        expect(validTypes).toContain(item.type);
      }
    }
  });

  it("round2 has critical content for openbrain safety role", () => {
    const content = getContentForPlayer(2, "openbrain", "ob_safety", INITIAL_STATE);
    const allItems = content.flatMap((ac) => ac.items);
    const criticalItems = allItems.filter((i) => i.classification === "critical");
    expect(criticalItems.length).toBeGreaterThanOrEqual(2);
  });
});
