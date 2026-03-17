/**
 * Tests for the Decision phase modal component.
 *
 * Invariants tested:
 * - INV-1: Both panels render when individual + team decisions are present
 * - INV-2: "No individual decision this round." when decisions.individual is null
 * - INV-3: "No team decision this round." when decisions.team is null
 * - INV-4: Submit calls submitDecision with chosen individual + team vote ids
 * - INV-5: decisionSubmitted=true → all radio inputs disabled + "Submitted ✓"
 * - INV-6: Leader sees vote tallies + "Lock Team Decision" button, not team vote radio
 * - INV-7: Non-leader sees team vote radio, no "Lock Team Decision" button
 * - INV-8: pausedAt set → displayed time freezes at endsAt - pausedAt (not live countdown)
 * - FAIL-1: phase !== "decision" → component renders nothing
 */

import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { useGameStore } from "../stores/game.js";

// ── Module mocks ─────────────────────────────────────────────────────────────
// Must be declared before any imports that transitively load these modules.

mock.module("../socket.js", () => ({
  socket: {
    id: "mock-socket-id",
    connected: false,
    on: () => {},
    once: () => {},
    off: () => {},
    emit: () => {},
    connect: () => {},
    disconnect: () => {},
  },
}));

mock.module("../sounds/index.js", () => ({
  soundManager: {
    play: mock(() => {}),
    muted: true,
    setMuted: () => {},
    toggleMute: () => {},
    subscribe: () => () => {},
  },
  useSoundEffects: () => ({ muted: true, toggleMute: () => {} }),
}));

// Import component after mocks are registered
const { Decision } = await import("./Decision.js");

// ── Shared test fixtures ─────────────────────────────────────────────────────

const INDIVIDUAL_DECISION = {
  role: "ob_cto" as const,
  prompt: "Should you publish the safety report?",
  options: [
    { id: "publish", label: "Publish", description: "Share with the world", effects: [] },
    { id: "suppress", label: "Suppress", description: "Keep it internal", effects: [] },
  ],
};

const TEAM_DECISION = {
  faction: "openbrain" as const,
  prompt: "What is the team strategy?",
  options: [
    { id: "speed", label: "Move Fast", description: "Prioritize speed", effects: [] },
    { id: "safe", label: "Go Slow", description: "Prioritize safety", effects: [] },
  ],
};

// A non-leader role: ob_cto (isLeader: false)
const NON_LEADER_ROLE = "ob_cto" as const;
// A leader role: ob_ceo (isLeader: true)
const LEADER_ROLE = "ob_ceo" as const;

// Timer far in the future so countdown is green and never expires during tests
const FAR_FUTURE = Date.now() + 10 * 60 * 1000; // 10 minutes from now

function baseState() {
  return {
    phase: "decision" as const,
    timer: { endsAt: FAR_FUTURE },
    decisions: { individual: INDIVIDUAL_DECISION, team: TEAM_DECISION },
    decisionSubmitted: false,
    teamVotes: {},
    teamLocked: false,
    selectedRole: NON_LEADER_ROLE,
    submitDecision: mock(() => {}),
    submitLeaderDecision: mock(() => {}),
  };
}

beforeEach(() => {
  useGameStore.setState(baseState());
});

afterEach(() => {
  cleanup();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Decision component — rendering", () => {
  it("INV-1: renders both individual and team decision panels", () => {
    render(<Decision />);
    expect(screen.getByText("Should you publish the safety report?")).toBeTruthy();
    expect(screen.getByText("What is the team strategy?")).toBeTruthy();
    expect(screen.getByText("Publish")).toBeTruthy();
    expect(screen.getByText("Move Fast")).toBeTruthy();
  });

  it("INV-2: shows placeholder when individual decision is null", () => {
    useGameStore.setState({ decisions: { individual: null, team: TEAM_DECISION } });
    render(<Decision />);
    expect(screen.getByText("No individual decision this round.")).toBeTruthy();
  });

  it("INV-3: shows placeholder when team decision is null", () => {
    useGameStore.setState({ decisions: { individual: INDIVIDUAL_DECISION, team: null } });
    render(<Decision />);
    expect(screen.getByText("No team decision this round.")).toBeTruthy();
  });

  it("FAIL-1: returns null when phase is not 'decision'", () => {
    useGameStore.setState({ phase: "play" as any });
    const { container } = render(<Decision />);
    expect(container.firstChild).toBeNull();
  });

  it("FAIL-1: returns null when phase is null", () => {
    useGameStore.setState({ phase: null });
    const { container } = render(<Decision />);
    expect(container.firstChild).toBeNull();
  });
});

describe("Decision component — submission flow", () => {
  it("INV-4: Submit calls submitDecision with chosen individual and team vote ids", () => {
    const submitDecision = mock(() => {});
    useGameStore.setState({ submitDecision });
    render(<Decision />);

    // Select individual choice
    const individualRadios = screen.getAllByRole("radio", { name: /Publish/i });
    fireEvent.click(individualRadios[0]);

    // Select team vote choice
    const teamRadios = screen.getAllByRole("radio", { name: /Move Fast/i });
    fireEvent.click(teamRadios[0]);

    // Click Submit
    fireEvent.click(screen.getByRole("button", { name: /Submit Decision/i }));

    expect(submitDecision).toHaveBeenCalledTimes(1);
    expect(submitDecision).toHaveBeenCalledWith("publish", "speed");
  });

  it("INV-4: Submit with only individual choice passes undefined for team vote", () => {
    const submitDecision = mock(() => {});
    useGameStore.setState({ submitDecision });
    render(<Decision />);

    // Select only individual
    const [radio] = screen.getAllByRole("radio", { name: /Publish/i });
    fireEvent.click(radio);

    fireEvent.click(screen.getByRole("button", { name: /Submit Decision/i }));

    expect(submitDecision).toHaveBeenCalledWith("publish", undefined);
  });

  it("INV-5: decisionSubmitted=true disables all radio inputs and shows 'Submitted ✓'", () => {
    useGameStore.setState({ decisionSubmitted: true });
    render(<Decision />);

    // All radio inputs must be disabled
    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect((radio as HTMLInputElement).disabled).toBe(true);
    }

    // Submit button shows submitted state
    expect(screen.getByRole("button", { name: /Submitted ✓/i })).toBeTruthy();
  });

  it("INV-5: Submit button is disabled when decisionSubmitted=true", () => {
    useGameStore.setState({ decisionSubmitted: true });
    render(<Decision />);
    const btn = screen.getByRole("button", { name: /Submitted ✓/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Decision component — leader vs non-leader", () => {
  it("INV-7: non-leader sees team vote radio group and no Lock button", () => {
    useGameStore.setState({ selectedRole: NON_LEADER_ROLE });
    render(<Decision />);

    // Team vote radios exist (grouped under name="team-vote")
    const teamVoteRadios = document.querySelectorAll('input[name="team-vote"]');
    expect(teamVoteRadios.length).toBeGreaterThan(0);

    // No lock button
    expect(screen.queryByRole("button", { name: /Lock Team Decision/i })).toBeNull();
  });

  it("INV-6: leader sees 'Lock Team Decision' button and no team-vote radio group", () => {
    useGameStore.setState({ selectedRole: LEADER_ROLE });
    render(<Decision />);

    expect(screen.getByRole("button", { name: /Lock Team Decision/i })).toBeTruthy();

    // No team-vote radio group
    const teamVoteRadios = document.querySelectorAll('input[name="team-vote"]');
    expect(teamVoteRadios.length).toBe(0);
  });

  it("INV-6: leader lock flow calls submitLeaderDecision with chosen team option", () => {
    const submitLeaderDecision = mock(() => {});
    useGameStore.setState({ selectedRole: LEADER_ROLE, submitLeaderDecision });
    render(<Decision />);

    // Select a leader final choice (uses name="leader-final")
    const leaderRadios = document.querySelectorAll('input[name="leader-final"]');
    fireEvent.click(leaderRadios[0]); // picks "speed"

    fireEvent.click(screen.getByRole("button", { name: /Lock Team Decision/i }));

    expect(submitLeaderDecision).toHaveBeenCalledTimes(1);
    expect(submitLeaderDecision).toHaveBeenCalledWith("speed");
  });

  it("INV-6: leader vote tallies section appears when teamVotes has entries", () => {
    useGameStore.setState({
      selectedRole: LEADER_ROLE,
      teamVotes: { player1: "speed", player2: "safe", player3: "speed" },
    });
    render(<Decision />);

    // "Team Votes" header should appear
    expect(screen.getByText("Team Votes")).toBeTruthy();
  });

  it("INV-6: lock button is disabled when teamLocked=true", () => {
    useGameStore.setState({ selectedRole: LEADER_ROLE, teamLocked: true });
    render(<Decision />);

    const lockBtn = screen.getByRole("button", { name: /Team Decision Locked/i });
    expect((lockBtn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("Decision component — auto-submit stale-closure fix", () => {
  // INV-1: timer auto-submit always submits the most recent user selection (not a
  //         stale closure value from a previous render).
  // INV-2: manual submit via button click uses the current selection.
  // INV-3: auto-submit fires exactly once (autoSubmitted guard still works).

  it("INV-1: timer auto-submit submits latest selection when user changed it before expiry", async () => {
    const submitDecision = mock(() => {});
    useGameStore.setState({ submitDecision, timer: { endsAt: FAR_FUTURE } });
    render(<Decision />);

    // Select option A
    fireEvent.click(screen.getAllByRole("radio", { name: /Publish/i })[0]);
    // Immediately change to option B
    fireEvent.click(screen.getAllByRole("radio", { name: /Suppress/i })[0]);

    // Timer fires — changing endsAt to the past causes tick() to set timedOut=true
    await act(async () => {
      useGameStore.setState({ timer: { endsAt: Date.now() - 100 } });
    });

    // Must submit option B (the latest selection), not option A
    expect(submitDecision).toHaveBeenCalledTimes(1);
    expect(submitDecision).toHaveBeenCalledWith("suppress", undefined);
  });

  it("INV-1: timer auto-submit with no selection submits empty string", async () => {
    const submitDecision = mock(() => {});
    // Render with an already-expired timer so auto-submit fires on mount
    useGameStore.setState({ submitDecision, timer: { endsAt: Date.now() - 100 } });

    await act(async () => {
      render(<Decision />);
    });

    expect(submitDecision).toHaveBeenCalledTimes(1);
    expect(submitDecision).toHaveBeenCalledWith("", undefined);
  });

  it("INV-2: manual submit via button uses the current selection", () => {
    const submitDecision = mock(() => {});
    useGameStore.setState({ submitDecision });
    render(<Decision />);

    fireEvent.click(screen.getAllByRole("radio", { name: /Suppress/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Submit Decision/i }));

    expect(submitDecision).toHaveBeenCalledWith("suppress", undefined);
  });

  it("INV-3: auto-submit fires exactly once even after repeated timer state changes", async () => {
    const submitDecision = mock(() => {});
    useGameStore.setState({ submitDecision, timer: { endsAt: Date.now() - 100 } });

    await act(async () => {
      render(<Decision />);
    });

    // Simulate another timer update (e.g. from the interval tick) — should not re-submit
    await act(async () => {
      useGameStore.setState({ timer: { endsAt: Date.now() - 200 } });
    });

    expect(submitDecision).toHaveBeenCalledTimes(1);
  });
});

describe("Decision component — timer display", () => {
  it("INV-8: when pausedAt is set, timer displays endsAt-pausedAt not live countdown", () => {
    // When pausedAt is set (timer paused), the displayed remaining time must freeze at
    // exactly (endsAt - pausedAt) regardless of how much real time has elapsed since.
    // The bug this test guards against: using "-" instead of "+" shifts the effective
    // end time backward, causing the display to count down at 2x speed when paused.
    const now = Date.now();
    const frozenRemaining = 90_000; // 90 seconds — what should display
    // pausedAt is in the past (pause happened some time ago)
    const pausedAt = now - 10_000; // paused 10 seconds ago
    const endsAt = pausedAt + frozenRemaining; // endsAt - pausedAt = 90s exactly

    useGameStore.setState({ timer: { endsAt, pausedAt } });
    render(<Decision />);

    // 90 seconds formats as "1:30"
    expect(screen.getByText("1:30")).toBeTruthy();
  });
});
