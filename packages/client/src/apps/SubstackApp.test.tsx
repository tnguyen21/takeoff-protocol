import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

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

const { useGameStore } = await import("../stores/game.js");
const { SubstackApp } = await import("./SubstackApp.js");

describe("SubstackApp", () => {
  beforeEach(() => {
    useGameStore.setState({
      selectedRole: null,
      publications: [],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("read-only roles can read the feed but do not see writer controls", () => {
    useGameStore.setState({ selectedRole: "ob_cto" });

    render(
      <SubstackApp
        content={[
          {
            id: "gen-substack-1",
            type: "document",
            round: 2,
            sender: "Global Analysis Desk",
            subject: "Compute Markets Tighten Again",
            body: "Demand for frontier training runs is colliding with export controls.",
            timestamp: new Date("2026-03-01T00:00:00Z").toISOString(),
            classification: "context",
          },
        ]}
      />,
    );

    expect(screen.getByText("The World Feed")).toBeTruthy();
    expect(screen.getAllByText("Global Analysis Desk")).toHaveLength(2);
    expect(screen.getAllByText("Compute Markets Tighten Again")).toHaveLength(2);
    expect(screen.queryByText("New post")).toBeNull();
    expect(screen.queryByText("Write")).toBeNull();
    expect(screen.getByText("Read-only access")).toBeTruthy();
  });

  it("writer roles can open the compose flow", () => {
    useGameStore.setState({ selectedRole: "ext_journalist" });

    render(<SubstackApp content={[]} />);

    fireEvent.click(screen.getByText("New post"));

    expect(screen.getByText("Publish to the public feed")).toBeTruthy();
    expect(screen.getByPlaceholderText("Article title…")).toBeTruthy();
    expect(screen.getByText("Publish to feed")).toBeTruthy();
  });
});
