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
      round: 2,
      publishArticle: mock(() => {}),
      generatePublicationDraft: mock(async () => ({ ok: false, error: "no draft" })),
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

  it("generate draft stays disabled until angle and target are selected", () => {
    useGameStore.setState({ selectedRole: "ext_journalist" });

    render(<SubstackApp content={[]} />);
    fireEvent.click(screen.getByText("New post"));

    const button = screen.getByText("Generate draft") as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    const [angleSelect, targetSelect] = screen.getAllByRole("combobox");
    fireEvent.change(angleSelect, { target: { value: "safety" } });
    expect(button.disabled).toBe(true);

    fireEvent.change(targetSelect, { target: { value: "general" } });
    expect(button.disabled).toBe(false);
  });

  it("successful draft generation fills title and body and locks further generation for the round", async () => {
    const generatePublicationDraft = mock(async () => ({
      ok: true,
      title: "Why The Compute Bottleneck Now Matters More Than The Model",
      body: "Generated draft body",
    }));
    useGameStore.setState({
      selectedRole: "ext_journalist",
      generatePublicationDraft,
    });

    render(<SubstackApp content={[]} />);
    fireEvent.click(screen.getByText("New post"));

    const [angleSelect, targetSelect] = screen.getAllByRole("combobox");
    fireEvent.change(angleSelect, { target: { value: "geopolitics" } });
    fireEvent.change(targetSelect, { target: { value: "china" } });
    fireEvent.click(screen.getByText("Generate draft"));

    expect(await screen.findByDisplayValue("Why The Compute Bottleneck Now Matters More Than The Model")).toBeTruthy();
    expect(await screen.findByDisplayValue("Generated draft body")).toBeTruthy();
    expect(generatePublicationDraft).toHaveBeenCalledWith({ angle: "geopolitics", targetFaction: "china" });

    const button = screen.getByText("Draft generated this round") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("publish still works after editing a generated draft", async () => {
    const publishArticle = mock(() => {});
    const generatePublicationDraft = mock(async () => ({
      ok: true,
      title: "Draft Title",
      body: "Draft body",
    }));
    useGameStore.setState({
      selectedRole: "ext_journalist",
      publishArticle,
      generatePublicationDraft,
    });

    render(<SubstackApp content={[]} />);
    fireEvent.click(screen.getByText("New post"));

    const [angleSelect, targetSelect] = screen.getAllByRole("combobox");
    fireEvent.change(angleSelect, { target: { value: "safety" } });
    fireEvent.change(targetSelect, { target: { value: "openbrain" } });
    fireEvent.click(screen.getByText("Generate draft"));

    const titleInput = await screen.findByDisplayValue("Draft Title");
    const bodyInput = await screen.findByDisplayValue("Draft body");
    fireEvent.change(titleInput, { target: { value: "Edited Title" } });
    fireEvent.change(bodyInput, { target: { value: "Edited body" } });
    fireEvent.click(screen.getByText("Publish to feed"));

    expect(publishArticle).toHaveBeenCalledWith({
      type: "article",
      title: "Edited Title",
      content: "Edited body",
      source: "",
      angle: "safety",
      targetFaction: "openbrain",
    });
  });
});
