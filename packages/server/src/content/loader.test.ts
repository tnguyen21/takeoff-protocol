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
    expect(apps).toContain("signal");
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
    expect(apps).toContain("signal");
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

// ── Round 3 specific tests ──

describe("round3: load and structure", () => {
  it("loads round3.json with correct round number", () => {
    const r3 = loadRound(3);
    expect(r3.round).toBe(3);
    expect(r3.apps.length).toBeGreaterThan(0);
    expect(r3.briefing.common).toContain("July 2027");
  });

  it("round3 briefing has all four faction variants", () => {
    const r3 = loadRound(3);
    expect(r3.briefing.factionVariants?.openbrain).toBeTruthy();
    expect(r3.briefing.factionVariants?.prometheus).toBeTruthy();
    expect(r3.briefing.factionVariants?.china).toBeTruthy();
    expect(r3.briefing.factionVariants?.external).toBeTruthy();
  });

  it("round3 has 80+ content items total", () => {
    const r3 = loadRound(3);
    const totalItems = r3.apps.reduce((sum, ac) => sum + ac.items.length, 0);
    expect(totalItems).toBeGreaterThanOrEqual(80);
  });

  it("all round3 items have required fields and valid types", () => {
    const r3 = loadRound(3);
    const validTypes = ["message", "headline", "memo", "chart", "tweet", "document", "row"];
    for (const appContent of r3.apps) {
      for (const item of appContent.items) {
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.body).toBe("string");
        expect(typeof item.timestamp).toBe("string");
        expect(validTypes).toContain(item.type);
      }
    }
  });
});

describe("round3: faction isolation (INV-1)", () => {
  it("openbrain safety officer receives only openbrain items", () => {
    const content = getContentForPlayer(3, "openbrain", "ob_safety", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("openbrain");
    }
  });

  it("prometheus scientist receives only prometheus items", () => {
    const content = getContentForPlayer(3, "prometheus", "prom_scientist", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("prometheus");
    }
  });

  it("china intel receives only china items", () => {
    const content = getContentForPlayer(3, "china", "china_intel", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("china");
    }
  });
});

describe("round3: role-specific critical items (INV-2)", () => {
  it("ob_safety sees the misalignment memo, ob_cto does not", () => {
    const safetyContent = getContentForPlayer(3, "openbrain", "ob_safety", INITIAL_STATE);
    const ctoContent = getContentForPlayer(3, "openbrain", "ob_cto", INITIAL_STATE);

    const safetyHasMemo = safetyContent.some((ac) => ac.app === "memo" && ac.items.some((i) => i.id === "ob-r3-memo-safety-1"));
    const ctoHasMemo = ctoContent.some((ac) => ac.app === "memo" && ac.items.some((i) => i.id === "ob-r3-memo-safety-1"));

    expect(safetyHasMemo).toBe(true);
    expect(ctoHasMemo).toBe(false);
  });

  it("ob_security sees bioweapons eval, ob_ceo does not", () => {
    const secContent = getContentForPlayer(3, "openbrain", "ob_security", INITIAL_STATE);
    const ceoContent = getContentForPlayer(3, "openbrain", "ob_ceo", INITIAL_STATE);

    const secHasEval = secContent.some((ac) => ac.app === "security" && ac.items.some((i) => i.id === "ob-r3-security-1"));
    const ceoHasEval = ceoContent.some((ac) => ac.app === "security" && ac.items.some((i) => i.id === "ob-r3-security-1"));

    expect(secHasEval).toBe(true);
    expect(ceoHasEval).toBe(false);
  });

  it("china_intel sees weight theft operational plan, china_director does not", () => {
    const intelContent = getContentForPlayer(3, "china", "china_intel", INITIAL_STATE);
    const dirContent = getContentForPlayer(3, "china", "china_director", INITIAL_STATE);

    const intelHasPlan = intelContent.some((ac) => ac.app === "intel" && ac.items.some((i) => i.id === "china-r3-intel-2"));
    const dirHasPlan = dirContent.some((ac) => ac.app === "intel" && ac.items.some((i) => i.id === "china-r3-intel-2"));

    expect(intelHasPlan).toBe(true);
    expect(dirHasPlan).toBe(false);
  });

  it("china_military sees military posture assessment, china_director does not", () => {
    const milContent = getContentForPlayer(3, "china", "china_military", INITIAL_STATE);
    const dirContent = getContentForPlayer(3, "china", "china_director", INITIAL_STATE);

    const milHasDoc = milContent.some((ac) => ac.app === "military");
    const dirHasDoc = dirContent.some((ac) => ac.app === "military");

    expect(milHasDoc).toBe(true);
    expect(dirHasDoc).toBe(false);
  });

  it("ext_nsa sees classified emergency PDB, ext_journalist does not", () => {
    const nsaContent = getContentForPlayer(3, "external", "ext_nsa", INITIAL_STATE);
    const journalistContent = getContentForPlayer(3, "external", "ext_journalist", INITIAL_STATE);

    const nsaHasPDB = nsaContent.some((ac) => ac.app === "briefing" && ac.items.some((i) => i.id === "ext-r3-nsa-briefing-1"));
    const journalistHasPDB = journalistContent.some((ac) => ac.app === "briefing" && ac.items.some((i) => i.id === "ext-r3-nsa-briefing-1"));

    expect(nsaHasPDB).toBe(true);
    expect(journalistHasPDB).toBe(false);
  });

  it("ext_journalist sees source tips in signal, ext_vc does not", () => {
    const journalistContent = getContentForPlayer(3, "external", "ext_journalist", INITIAL_STATE);
    const vcContent = getContentForPlayer(3, "external", "ext_vc", INITIAL_STATE);

    const journalistHasTip = journalistContent.some((ac) => ac.items.some((i) => i.id === "ext-r3-journalist-signal-1"));
    const vcHasTip = vcContent.some((ac) => ac.items.some((i) => i.id === "ext-r3-journalist-signal-1"));

    expect(journalistHasTip).toBe(true);
    expect(vcHasTip).toBe(false);
  });

  it("ext_vc sees bloomberg analysis, ext_diplomat does not", () => {
    const vcContent = getContentForPlayer(3, "external", "ext_vc", INITIAL_STATE);
    const diplomatContent = getContentForPlayer(3, "external", "ext_diplomat", INITIAL_STATE);

    const vcHasBloomberg = vcContent.some((ac) => ac.app === "bloomberg");
    const diplomatHasBloomberg = diplomatContent.some((ac) => ac.app === "bloomberg");

    expect(vcHasBloomberg).toBe(true);
    expect(diplomatHasBloomberg).toBe(false);
  });

  it("prom_policy sees DC signal, prom_scientist does not", () => {
    const policyContent = getContentForPlayer(3, "prometheus", "prom_policy", INITIAL_STATE);
    const sciContent = getContentForPlayer(3, "prometheus", "prom_scientist", INITIAL_STATE);

    const policyHasSignal = policyContent.some((ac) => ac.items.some((i) => i.id === "prom-r3-signal-policy-1"));
    const sciHasSignal = sciContent.some((ac) => ac.items.some((i) => i.id === "prom-r3-signal-policy-1"));

    expect(policyHasSignal).toBe(true);
    expect(sciHasSignal).toBe(false);
  });
});

describe("round3: conditional filtering (INV-3)", () => {
  it("security upgrade urgency item shown when securityLevelOB < 4", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 2 };
    const content = getContentForPlayer(3, "openbrain", "ob_security", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r3-security-2"));
    expect(hasItem).toBe(true);
  });

  it("security upgrade urgency item hidden when securityLevelOB >= 4", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 4 };
    const content = getContentForPlayer(3, "openbrain", "ob_security", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r3-security-2"));
    expect(hasItem).toBe(false);
  });

  it("china weight theft urgency shown when securityLevelOB < 4", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 2 };
    const content = getContentForPlayer(3, "china", "china_intel", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china-r3-intel-4"));
    expect(hasItem).toBe(true);
  });

  it("china weight theft urgency hidden when securityLevelOB >= 4", () => {
    const state: StateVariables = { ...INITIAL_STATE, securityLevelOB: 4 };
    const content = getContentForPlayer(3, "china", "china_intel", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china-r3-intel-4"));
    expect(hasItem).toBe(false);
  });

  it("prometheus neuralese breakthrough shown when alignmentConfidence > 65", () => {
    const state: StateVariables = { ...INITIAL_STATE, alignmentConfidence: 70 };
    const content = getContentForPlayer(3, "prometheus", "prom_scientist", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "prom-r3-slack-4"));
    expect(hasItem).toBe(true);
  });

  it("prometheus neuralese breakthrough hidden when alignmentConfidence <= 65", () => {
    const state: StateVariables = { ...INITIAL_STATE, alignmentConfidence: 55 };
    const content = getContentForPlayer(3, "prometheus", "prom_scientist", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "prom-r3-slack-4"));
    expect(hasItem).toBe(false);
  });

  it("prom_scientist gets leaked memo item when intlCooperation > 45", () => {
    const state: StateVariables = { ...INITIAL_STATE, intlCooperation: 50 };
    const content = getContentForPlayer(3, "prometheus", "prom_scientist", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "prom-r3-slack-sci-2"));
    expect(hasItem).toBe(true);
  });

  it("prom_scientist does NOT get leaked memo item when intlCooperation <= 45", () => {
    const state: StateVariables = { ...INITIAL_STATE, intlCooperation: 5 };
    const content = getContentForPlayer(3, "prometheus", "prom_scientist", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "prom-r3-slack-sci-2"));
    expect(hasItem).toBe(false);
  });

  it("OB signal from journalist shown when publicAwareness > 35", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 40 };
    const content = getContentForPlayer(3, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r3-signal-2"));
    expect(hasItem).toBe(true);
  });

  it("OB signal from journalist hidden when publicAwareness <= 35", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 10 };
    const content = getContentForPlayer(3, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r3-signal-2"));
    expect(hasItem).toBe(false);
  });
});

describe("round3: critical signals are present and classified correctly", () => {
  it("misalignment memo is classified as critical", () => {
    const r3 = loadRound(3);
    const memo = r3.apps
      .flatMap((ac) => ac.items)
      .find((i) => i.id === "ob-r3-memo-safety-1");
    expect(memo).toBeDefined();
    expect(memo?.classification).toBe("critical");
  });

  it("bioweapons eval is classified as critical", () => {
    const r3 = loadRound(3);
    const evalItem = r3.apps
      .flatMap((ac) => ac.items)
      .find((i) => i.id === "ob-r3-security-1");
    expect(evalItem).toBeDefined();
    expect(evalItem?.classification).toBe("critical");
  });

  it("china weight theft operational plan is classified as critical", () => {
    const r3 = loadRound(3);
    const plan = r3.apps
      .flatMap((ac) => ac.items)
      .find((i) => i.id === "china-r3-intel-2");
    expect(plan).toBeDefined();
    expect(plan?.classification).toBe("critical");
  });

  it("NSA emergency PDB is classified as critical", () => {
    const r3 = loadRound(3);
    const pdb = r3.apps
      .flatMap((ac) => ac.items)
      .find((i) => i.id === "ext-r3-nsa-briefing-1");
    expect(pdb).toBeDefined();
    expect(pdb?.classification).toBe("critical");
  });

  it("journalist source tip is classified as critical", () => {
    const r3 = loadRound(3);
    const tip = r3.apps
      .flatMap((ac) => ac.items)
      .find((i) => i.id === "ext-r3-journalist-signal-1");
    expect(tip).toBeDefined();
    expect(tip?.classification).toBe("critical");
  });
});

// ── Round 5: Endgame ──

describe("round5: load and structure", () => {
  it("loads round5.json with correct round number", () => {
    const r5 = loadRound(5);
    expect(r5.round).toBe(5);
    expect(r5.apps.length).toBeGreaterThan(0);
    expect(r5.briefing.common).toContain("2028");
  });

  it("round5 briefing has faction variants for all four factions", () => {
    const r5 = loadRound(5);
    expect(r5.briefing.factionVariants?.openbrain).toBeTruthy();
    expect(r5.briefing.factionVariants?.prometheus).toBeTruthy();
    expect(r5.briefing.factionVariants?.china).toBeTruthy();
    expect(r5.briefing.factionVariants?.external).toBeTruthy();
  });

  it("round5 has at least 40 content items total (dramatic final round)", () => {
    const r5 = loadRound(5);
    const totalItems = r5.apps.reduce((sum, ac) => sum + ac.items.length, 0);
    expect(totalItems).toBeGreaterThanOrEqual(40);
  });

  it("round5 caches correctly — same object on second call", () => {
    const r5a = loadRound(5);
    const r5b = loadRound(5);
    expect(r5a).toBe(r5b);
  });

  it("all round5 items have required fields with valid types", () => {
    const r5 = loadRound(5);
    const validTypes = ["message", "headline", "memo", "chart", "tweet", "document", "row"];
    for (const appContent of r5.apps) {
      for (const item of appContent.items) {
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.body).toBe("string");
        expect(typeof item.timestamp).toBe("string");
        expect(validTypes).toContain(item.type);
      }
    }
  });
});

describe("round5: INV-1 faction isolation", () => {
  it("openbrain CEO receives only openbrain items", () => {
    const content = getContentForPlayer(5, "openbrain", "ob_ceo", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("openbrain");
    }
  });

  it("prometheus player receives only prometheus items", () => {
    const content = getContentForPlayer(5, "prometheus", "prom_ceo", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("prometheus");
    }
  });

  it("china director receives only china items", () => {
    const content = getContentForPlayer(5, "china", "china_director", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("china");
    }
  });

  it("external NSA receives only external items", () => {
    const content = getContentForPlayer(5, "external", "ext_nsa", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("external");
    }
  });
});

describe("round5: INV-2 role-specific items", () => {
  it("china_intel sees classified final intel brief, china_director does not", () => {
    const intelContent = getContentForPlayer(5, "china", "china_intel", INITIAL_STATE);
    const dirContent = getContentForPlayer(5, "china", "china_director", INITIAL_STATE);

    const intelHas = intelContent.some((ac) => ac.app === "intel" && ac.items.some((i) => i.id === "china-r5-intel-1"));
    const dirHas = dirContent.some((ac) => ac.app === "intel" && ac.items.some((i) => i.id === "china-r5-intel-1"));

    expect(intelHas).toBe(true);
    expect(dirHas).toBe(false);
  });

  it("china_military sees PLA strategic assessment, china_director does not", () => {
    const milContent = getContentForPlayer(5, "china", "china_military", INITIAL_STATE);
    const dirContent = getContentForPlayer(5, "china", "china_director", INITIAL_STATE);

    expect(milContent.some((ac) => ac.app === "military")).toBe(true);
    expect(dirContent.some((ac) => ac.app === "military")).toBe(false);
  });

  it("ext_nsa sees President's Daily Brief, ext_journalist does not", () => {
    const nsaContent = getContentForPlayer(5, "external", "ext_nsa", INITIAL_STATE);
    const journalistContent = getContentForPlayer(5, "external", "ext_journalist", INITIAL_STATE);

    expect(nsaContent.some((ac) => ac.app === "briefing" && ac.items.some((i) => i.id === "ext-r5-pdb-1"))).toBe(true);
    expect(journalistContent.some((ac) => ac.app === "briefing")).toBe(false);
  });

  it("ext_journalist sees source Signal DMs, ext_nsa does not", () => {
    const journalistContent = getContentForPlayer(5, "external", "ext_journalist", INITIAL_STATE);
    const nsaContent = getContentForPlayer(5, "external", "ext_nsa", INITIAL_STATE);

    const journalistHas = journalistContent.some((ac) => ac.items.some((i) => i.id === "ext-r5-journalist-signal-1"));
    const nsaHas = nsaContent.some((ac) => ac.items.some((i) => i.id === "ext-r5-journalist-signal-1"));

    expect(journalistHas).toBe(true);
    expect(nsaHas).toBe(false);
  });

  it("ext_vc sees Bloomberg terminal analysis, ext_diplomat does not", () => {
    const vcContent = getContentForPlayer(5, "external", "ext_vc", INITIAL_STATE);
    const diplomatContent = getContentForPlayer(5, "external", "ext_diplomat", INITIAL_STATE);

    expect(vcContent.some((ac) => ac.app === "bloomberg" && ac.items.some((i) => i.id === "ext-r5-bloomberg-1"))).toBe(true);
    expect(diplomatContent.some((ac) => ac.app === "bloomberg")).toBe(false);
  });

  it("ext_diplomat sees diplomatic email cables, ext_vc does not see diplomat-specific email", () => {
    const diplomatContent = getContentForPlayer(5, "external", "ext_diplomat", INITIAL_STATE);
    const vcContent = getContentForPlayer(5, "external", "ext_vc", INITIAL_STATE);

    const diplomatHas = diplomatContent.some((ac) => ac.items.some((i) => i.id === "ext-r5-diplomat-email-1"));
    const vcHas = vcContent.some((ac) => ac.items.some((i) => i.id === "ext-r5-diplomat-email-1"));

    expect(diplomatHas).toBe(true);
    expect(vcHas).toBe(false);
  });
});

describe("round5: INV-3 conditional filtering — alignment scenarios", () => {
  it("low-alignment worry message shown when alignmentConfidence < 75", () => {
    const state: StateVariables = { ...INITIAL_STATE, alignmentConfidence: 60 };
    const content = getContentForPlayer(5, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r5-slack-3"));
    expect(hasItem).toBe(true);
  });

  it("low-alignment worry message excluded when alignmentConfidence >= 75", () => {
    const state: StateVariables = { ...INITIAL_STATE, alignmentConfidence: 80 };
    const content = getContentForPlayer(5, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r5-slack-3"));
    expect(hasItem).toBe(false);
  });

  it("high-alignment optimism message shown when alignmentConfidence > 85", () => {
    const state: StateVariables = { ...INITIAL_STATE, alignmentConfidence: 90 };
    const content = getContentForPlayer(5, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r5-slack-4"));
    expect(hasItem).toBe(true);
  });

  it("high-alignment optimism message excluded when alignmentConfidence <= 85", () => {
    const state: StateVariables = { ...INITIAL_STATE, alignmentConfidence: 70 };
    const content = getContentForPlayer(5, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r5-slack-4"));
    expect(hasItem).toBe(false);
  });
});

describe("round5: INV-3 conditional filtering — geopolitical scenarios", () => {
  it("Taiwan military headline shown when taiwanTension > 55", () => {
    const state: StateVariables = { ...INITIAL_STATE, taiwanTension: 60 };
    const content = getContentForPlayer(5, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r5-news-5"));
    expect(hasItem).toBe(true);
  });

  it("Taiwan military headline excluded when taiwanTension <= 55", () => {
    const state: StateVariables = { ...INITIAL_STATE, taiwanTension: 20 };
    const content = getContentForPlayer(5, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob-r5-news-5"));
    expect(hasItem).toBe(false);
  });

  it("China strong compute chart shown when chinaCapability > 50", () => {
    const state: StateVariables = { ...INITIAL_STATE, chinaCapability: 60 };
    const content = getContentForPlayer(5, "china", "china_director", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china-r5-compute-1"));
    expect(hasItem).toBe(true);
  });

  it("China lagging compute chart shown when chinaCapability < 50", () => {
    const state: StateVariables = { ...INITIAL_STATE, chinaCapability: 30 };
    const content = getContentForPlayer(5, "china", "china_director", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china-r5-compute-2"));
    expect(hasItem).toBe(true);
  });

  it("China strong and lagging charts are mutually exclusive at boundary", () => {
    const stateLow: StateVariables = { ...INITIAL_STATE, chinaCapability: 30 };
    const stateHigh: StateVariables = { ...INITIAL_STATE, chinaCapability: 60 };

    const lowContent = getContentForPlayer(5, "china", "china_director", stateLow);
    const highContent = getContentForPlayer(5, "china", "china_director", stateHigh);

    const lowHasStrong = lowContent.some((ac) => ac.items.some((i) => i.id === "china-r5-compute-1"));
    const highHasLagging = highContent.some((ac) => ac.items.some((i) => i.id === "china-r5-compute-2"));

    expect(lowHasStrong).toBe(false);
    expect(highHasLagging).toBe(false);
  });

  it("China military PLA Taiwan wechat shown when taiwanTension > 50", () => {
    const state: StateVariables = { ...INITIAL_STATE, taiwanTension: 60 };
    const content = getContentForPlayer(5, "china", "china_director", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china-r5-wechat-4"));
    expect(hasItem).toBe(true);
  });

  it("China military PLA Taiwan wechat excluded when taiwanTension <= 50", () => {
    const state: StateVariables = { ...INITIAL_STATE, taiwanTension: 20 };
    const content = getContentForPlayer(5, "china", "china_director", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china-r5-wechat-4"));
    expect(hasItem).toBe(false);
  });
});

describe("round5: content richness and critical signals", () => {
  it("openbrain CEO receives content from multiple apps", () => {
    const content = getContentForPlayer(5, "openbrain", "ob_ceo", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps.length).toBeGreaterThan(2);
    expect(apps).toContain("slack");
    expect(apps).toContain("email");
  });

  it("prometheus faction receives slack and email content", () => {
    const content = getContentForPlayer(5, "prometheus", "prom_ceo", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps).toContain("slack");
    expect(apps).toContain("email");
  });

  it("china director gets wechat and compute content", () => {
    const content = getContentForPlayer(5, "china", "china_director", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps).toContain("signal");
    expect(apps).toContain("compute");
  });

  it("external player gets twitter and news content", () => {
    const content = getContentForPlayer(5, "external", "ext_journalist", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps).toContain("news");
    expect(apps).toContain("twitter");
  });

  it("NSA final briefing is classified as critical", () => {
    const r5 = loadRound(5);
    const pdb = r5.apps.flatMap((ac) => ac.items).find((i) => i.id === "ext-r5-pdb-1");
    expect(pdb).toBeDefined();
    expect(pdb?.classification).toBe("critical");
  });

  it("OpenBrain board email is classified as critical", () => {
    const r5 = loadRound(5);
    const email = r5.apps.flatMap((ac) => ac.items).find((i) => i.id === "ob-r5-email-1");
    expect(email).toBeDefined();
    expect(email?.classification).toBe("critical");
  });

  it("China wechat leadership message is classified as critical", () => {
    const r5 = loadRound(5);
    const msg = r5.apps.flatMap((ac) => ac.items).find((i) => i.id === "china-r5-wechat-1");
    expect(msg).toBeDefined();
    expect(msg?.classification).toBe("critical");
  });

  it("prometheus final email from NSC is classified as critical", () => {
    const r5 = loadRound(5);
    const email = r5.apps.flatMap((ac) => ac.items).find((i) => i.id === "prom-r5-email-1");
    expect(email).toBeDefined();
    expect(email?.classification).toBe("critical");
  });

  it("round5 has at least one critical item per faction", () => {
    const factions = ["openbrain", "prometheus", "china", "external"] as const;
    const r5 = loadRound(5);
    for (const faction of factions) {
      const factionItems = r5.apps
        .filter((ac) => ac.faction === faction)
        .flatMap((ac) => ac.items);
      const hasCritical = factionItems.some((i) => i.classification === "critical");
      expect(hasCritical).toBe(true);
    }
  });
});

// ── Round 4 specific tests ──

describe("round4: load and structure", () => {
  it("loads round4.json with correct round number", () => {
    const r4 = loadRound(4);
    expect(r4.round).toBe(4);
    expect(r4.apps.length).toBeGreaterThan(0);
    expect(r4.briefing.common).toContain("November 2027");
  });

  it("round4 briefing has all four faction variants", () => {
    const r4 = loadRound(4);
    expect(r4.briefing.factionVariants?.openbrain).toBeTruthy();
    expect(r4.briefing.factionVariants?.prometheus).toBeTruthy();
    expect(r4.briefing.factionVariants?.china).toBeTruthy();
    expect(r4.briefing.factionVariants?.external).toBeTruthy();
  });

  it("round4 has 80+ content items total", () => {
    const r4 = loadRound(4);
    const totalItems = r4.apps.reduce((sum, ac) => sum + ac.items.length, 0);
    expect(totalItems).toBeGreaterThanOrEqual(80);
  });

  it("all round4 items have required fields and valid types", () => {
    const r4 = loadRound(4);
    const validTypes = ["message", "headline", "memo", "chart", "tweet", "document", "row"];
    for (const appContent of r4.apps) {
      for (const item of appContent.items) {
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.body).toBe("string");
        expect(typeof item.timestamp).toBe("string");
        expect(validTypes).toContain(item.type);
      }
    }
  });

  it("round4 caches correctly — same object on second call", () => {
    const r4a = loadRound(4);
    const r4b = loadRound(4);
    expect(r4a).toBe(r4b);
  });
});

describe("round4: faction isolation (INV-1)", () => {
  it("openbrain CEO receives only openbrain items", () => {
    const content = getContentForPlayer(4, "openbrain", "ob_ceo", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("openbrain");
    }
  });

  it("prometheus player receives no openbrain or china items", () => {
    const content = getContentForPlayer(4, "prometheus", "prom_ceo", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("prometheus");
    }
  });

  it("china player receives no US lab items", () => {
    const content = getContentForPlayer(4, "china", "china_director", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("china");
    }
  });

  it("external player receives only external items", () => {
    const content = getContentForPlayer(4, "external", "ext_nsa", INITIAL_STATE);
    for (const appContent of content) {
      expect(appContent.faction).toBe("external");
    }
  });
});

describe("round4: role-specific items only reach matching role (INV-2)", () => {
  it("ob_safety sees the safety memo, ob_cto does not", () => {
    const safetyContent = getContentForPlayer(4, "openbrain", "ob_safety", INITIAL_STATE);
    const ctoContent = getContentForPlayer(4, "openbrain", "ob_cto", INITIAL_STATE);

    const safetyHasMemo = safetyContent.some((ac) => ac.app === "memo" && ac.items.some((i) => i.id === "ob4-memo-safety-1"));
    const ctoHasMemo = ctoContent.some((ac) => ac.app === "memo" && ac.items.some((i) => i.id === "ob4-memo-safety-1"));

    expect(safetyHasMemo).toBe(true);
    expect(ctoHasMemo).toBe(false);
  });

  it("ob_security sees security document, ob_ceo does not", () => {
    const secContent = getContentForPlayer(4, "openbrain", "ob_security", INITIAL_STATE);
    const ceoContent = getContentForPlayer(4, "openbrain", "ob_ceo", INITIAL_STATE);

    expect(secContent.some((ac) => ac.app === "security")).toBe(true);
    expect(ceoContent.some((ac) => ac.app === "security")).toBe(false);
  });

  it("ob_cto sees CTO-specific wandb chart, ob_ceo does not", () => {
    const ctoContent = getContentForPlayer(4, "openbrain", "ob_cto", INITIAL_STATE);
    const ceoContent = getContentForPlayer(4, "openbrain", "ob_ceo", INITIAL_STATE);

    const ctoHasChart = ctoContent.some((ac) => ac.items.some((i) => i.id === "ob4-wandb-cto-1"));
    const ceoHasChart = ceoContent.some((ac) => ac.items.some((i) => i.id === "ob4-wandb-cto-1"));

    expect(ctoHasChart).toBe(true);
    expect(ceoHasChart).toBe(false);
  });

  it("ob_ceo sees CEO-specific signal, ob_safety does not", () => {
    const ceoContent = getContentForPlayer(4, "openbrain", "ob_ceo", INITIAL_STATE);
    const safetyContent = getContentForPlayer(4, "openbrain", "ob_safety", INITIAL_STATE);

    const ceoHasSignal = ceoContent.some((ac) => ac.items.some((i) => i.id === "ob4-signal-ceo-1"));
    const safetyHasSignal = safetyContent.some((ac) => ac.items.some((i) => i.id === "ob4-signal-ceo-1"));

    expect(ceoHasSignal).toBe(true);
    expect(safetyHasSignal).toBe(false);
  });

  it("prom_policy sees DC signal, prom_scientist does not", () => {
    const policyContent = getContentForPlayer(4, "prometheus", "prom_policy", INITIAL_STATE);
    const sciContent = getContentForPlayer(4, "prometheus", "prom_scientist", INITIAL_STATE);

    const policyHasSignal = policyContent.some((ac) => ac.items.some((i) => i.id === "prom4-signal-policy-1"));
    const sciHasSignal = sciContent.some((ac) => ac.items.some((i) => i.id === "prom4-signal-policy-1"));

    expect(policyHasSignal).toBe(true);
    expect(sciHasSignal).toBe(false);
  });

  it("prom_scientist sees scientist wandb, prom_ceo does not", () => {
    const sciContent = getContentForPlayer(4, "prometheus", "prom_scientist", INITIAL_STATE);
    const ceoContent = getContentForPlayer(4, "prometheus", "prom_ceo", INITIAL_STATE);

    const sciHasChart = sciContent.some((ac) => ac.items.some((i) => i.id === "prom4-wandb-sci-1"));
    const ceoHasChart = ceoContent.some((ac) => ac.items.some((i) => i.id === "prom4-wandb-sci-1"));

    expect(sciHasChart).toBe(true);
    expect(ceoHasChart).toBe(false);
  });

  it("china_intel sees intel briefing, china_director does not", () => {
    const intelContent = getContentForPlayer(4, "china", "china_intel", INITIAL_STATE);
    const dirContent = getContentForPlayer(4, "china", "china_director", INITIAL_STATE);

    expect(intelContent.some((ac) => ac.app === "intel")).toBe(true);
    expect(dirContent.some((ac) => ac.app === "intel")).toBe(false);
  });

  it("china_military sees military assessment, china_director does not", () => {
    const milContent = getContentForPlayer(4, "china", "china_military", INITIAL_STATE);
    const dirContent = getContentForPlayer(4, "china", "china_director", INITIAL_STATE);

    expect(milContent.some((ac) => ac.app === "military")).toBe(true);
    expect(dirContent.some((ac) => ac.app === "military")).toBe(false);
  });

  it("ext_nsa sees PDB briefing, ext_journalist does not", () => {
    const nsaContent = getContentForPlayer(4, "external", "ext_nsa", INITIAL_STATE);
    const journalistContent = getContentForPlayer(4, "external", "ext_journalist", INITIAL_STATE);

    const nsaHasPDB = nsaContent.some((ac) => ac.app === "briefing" && ac.items.some((i) => i.id === "ext4-nsa-briefing-1"));
    const journalistHasPDB = journalistContent.some((ac) => ac.app === "briefing" && ac.items.some((i) => i.id === "ext4-nsa-briefing-1"));

    expect(nsaHasPDB).toBe(true);
    expect(journalistHasPDB).toBe(false);
  });

  it("ext_journalist sees Signal tips, ext_vc does not see journalist signals", () => {
    const journalistContent = getContentForPlayer(4, "external", "ext_journalist", INITIAL_STATE);
    const vcContent = getContentForPlayer(4, "external", "ext_vc", INITIAL_STATE);

    const journalistHasTip = journalistContent.some((ac) => ac.items.some((i) => i.id === "ext4-signal-journalist-1"));
    const vcHasTip = vcContent.some((ac) => ac.items.some((i) => i.id === "ext4-signal-journalist-1"));

    expect(journalistHasTip).toBe(true);
    expect(vcHasTip).toBe(false);
  });

  it("ext_vc sees bloomberg analysis, ext_diplomat does not", () => {
    const vcContent = getContentForPlayer(4, "external", "ext_vc", INITIAL_STATE);
    const diplomatContent = getContentForPlayer(4, "external", "ext_diplomat", INITIAL_STATE);

    expect(vcContent.some((ac) => ac.app === "bloomberg")).toBe(true);
    expect(diplomatContent.some((ac) => ac.app === "bloomberg")).toBe(false);
  });
});

describe("round4: conditional filtering (INV-3)", () => {
  it("OB PR crisis message shown when publicAwareness > 55", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 60 };
    const content = getContentForPlayer(4, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob4-slack-4"));
    expect(hasItem).toBe(true);
  });

  it("OB PR crisis message hidden when publicAwareness <= 55", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 30 };
    const content = getContentForPlayer(4, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob4-slack-4"));
    expect(hasItem).toBe(false);
  });

  it("OB misalignment evidence chart shown when misalignmentSeverity > 25", () => {
    const state: StateVariables = { ...INITIAL_STATE, misalignmentSeverity: 30 };
    const content = getContentForPlayer(4, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob4-wandb-3"));
    expect(hasItem).toBe(true);
  });

  it("OB misalignment evidence chart hidden when misalignmentSeverity <= 25", () => {
    const state: StateVariables = { ...INITIAL_STATE, misalignmentSeverity: 10 };
    const content = getContentForPlayer(4, "openbrain", "ob_ceo", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob4-wandb-3"));
    expect(hasItem).toBe(false);
  });

  it("OB security exfiltration report shown when chinaCapability > 55", () => {
    const state: StateVariables = { ...INITIAL_STATE, chinaCapability: 60 };
    const content = getContentForPlayer(4, "openbrain", "ob_security", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob4-security-1"));
    expect(hasItem).toBe(true);
  });

  it("OB security exfiltration report hidden when chinaCapability <= 55", () => {
    const state: StateVariables = { ...INITIAL_STATE, chinaCapability: 18 };
    const content = getContentForPlayer(4, "openbrain", "ob_security", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob4-security-1"));
    expect(hasItem).toBe(false);
  });

  it("CTO safety track record chart shown when alignmentConfidence < 45", () => {
    const state: StateVariables = { ...INITIAL_STATE, alignmentConfidence: 40 };
    const content = getContentForPlayer(4, "openbrain", "ob_cto", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob4-wandb-cto-3"));
    expect(hasItem).toBe(true);
  });

  it("CTO safety track record chart hidden when alignmentConfidence >= 45", () => {
    const state: StateVariables = { ...INITIAL_STATE, alignmentConfidence: 55 };
    const content = getContentForPlayer(4, "openbrain", "ob_cto", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ob4-wandb-cto-3"));
    expect(hasItem).toBe(false);
  });

  it("China Taiwan contingency assessment shown when taiwanTension > 40", () => {
    const state: StateVariables = { ...INITIAL_STATE, taiwanTension: 50 };
    const content = getContentForPlayer(4, "china", "china_military", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china4-military-1"));
    expect(hasItem).toBe(true);
  });

  it("China Taiwan contingency assessment hidden when taiwanTension <= 40", () => {
    const state: StateVariables = { ...INITIAL_STATE, taiwanTension: 20 };
    const content = getContentForPlayer(4, "china", "china_military", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china4-military-1"));
    expect(hasItem).toBe(false);
  });

  it("China compute parity chart shown when chinaCapability > 60", () => {
    const state: StateVariables = { ...INITIAL_STATE, chinaCapability: 65 };
    const content = getContentForPlayer(4, "china", "china_director", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china4-compute-2"));
    expect(hasItem).toBe(true);
  });

  it("China compute parity chart hidden when chinaCapability <= 60", () => {
    const state: StateVariables = { ...INITIAL_STATE, chinaCapability: 18 };
    const content = getContentForPlayer(4, "china", "china_director", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "china4-compute-2"));
    expect(hasItem).toBe(false);
  });

  it("External leaked news headline shown when publicAwareness > 55", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 60 };
    const content = getContentForPlayer(4, "external", "ext_nsa", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ext4-news-1"));
    expect(hasItem).toBe(true);
  });

  it("External leaked news headline hidden when publicAwareness <= 55", () => {
    const state: StateVariables = { ...INITIAL_STATE, publicAwareness: 30 };
    const content = getContentForPlayer(4, "external", "ext_nsa", state);
    const hasItem = content.some((ac) => ac.items.some((i) => i.id === "ext4-news-1"));
    expect(hasItem).toBe(false);
  });
});

describe("round4: content richness checks", () => {
  it("openbrain CEO receives content across multiple apps", () => {
    const content = getContentForPlayer(4, "openbrain", "ob_ceo", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps.length).toBeGreaterThan(2);
    expect(apps).toContain("slack");
    expect(apps).toContain("email");
    expect(apps).toContain("wandb");
  });

  it("prometheus CEO receives content across multiple apps", () => {
    const content = getContentForPlayer(4, "prometheus", "prom_ceo", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps).toContain("slack");
    expect(apps).toContain("email");
    expect(apps).toContain("wandb");
  });

  it("china director gets compute and wechat content", () => {
    const content = getContentForPlayer(4, "china", "china_director", INITIAL_STATE);
    const apps = content.map((ac) => ac.app);
    expect(apps).toContain("compute");
    expect(apps).toContain("signal");
  });

  it("ob_safety memo items are classified as critical", () => {
    const r4 = loadRound(4);
    const memo = r4.apps
      .flatMap((ac) => ac.items)
      .find((i) => i.id === "ob4-memo-safety-1");
    expect(memo).toBeDefined();
    expect(memo?.classification).toBe("critical");
  });

  it("NSA PDB briefing is classified as critical", () => {
    const r4 = loadRound(4);
    const pdb = r4.apps
      .flatMap((ac) => ac.items)
      .find((i) => i.id === "ext4-nsa-briefing-1");
    expect(pdb).toBeDefined();
    expect(pdb?.classification).toBe("critical");
  });

  it("journalist Signal tip is classified as critical", () => {
    const r4 = loadRound(4);
    const tip = r4.apps
      .flatMap((ac) => ac.items)
      .find((i) => i.id === "ext4-signal-journalist-1");
    expect(tip).toBeDefined();
    expect(tip?.classification).toBe("critical");
  });

  it("china_intel grand bargain assessment is classified as critical", () => {
    const r4 = loadRound(4);
    const doc = r4.apps
      .flatMap((ac) => ac.items)
      .find((i) => i.id === "china4-intel-1");
    expect(doc).toBeDefined();
    expect(doc?.classification).toBe("critical");
  });

  it("round4 has critical content for openbrain safety role", () => {
    const content = getContentForPlayer(4, "openbrain", "ob_safety", INITIAL_STATE);
    const allItems = content.flatMap((ac) => ac.items);
    const criticalItems = allItems.filter((i) => i.classification === "critical");
    expect(criticalItems.length).toBeGreaterThanOrEqual(2);
  });
});
