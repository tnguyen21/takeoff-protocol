/**
 * Tests for the ErrorBoundary component.
 *
 * Invariants tested:
 * - INV-1: When a child throws during render, ErrorBoundary catches it and renders fallback UI
 * - INV-2: When no error occurs, children render normally (boundary is invisible)
 * - INV-3: After clicking "Reload", error state resets and children attempt to re-render
 *
 * Critical paths:
 * - Component that throws on first render shows fallback
 * - Component that throws on re-render shows fallback
 * - Multiple ErrorBoundary instances are independent
 *
 * Failure modes (documented, not tested):
 * - Errors thrown in event handlers are NOT caught by error boundaries — they propagate
 *   normally as unhandled errors. This is a React limitation, not a bug in ErrorBoundary.
 */

import { describe, expect, it, beforeEach, afterEach, spyOn } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useState } from "react";
import { ErrorBoundary } from "./ErrorBoundary.js";

// Suppress React's console.error output during error boundary tests
let consoleErrorSpy: ReturnType<typeof spyOn<typeof console, "error">>;

beforeEach(() => {
  consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  consoleErrorSpy.mockRestore();
});

// ── Test helpers ──────────────────────────────────────────────────────────────

function ThrowOnRender({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("render error");
  return <div>Children rendered</div>;
}

// Throws on second and subsequent renders (after a state update triggers re-render)
function ThrowOnRerender() {
  const [count, setCount] = useState(0);
  if (count > 0) throw new Error("rerender error");
  return <button onClick={() => setCount((c) => c + 1)}>Trigger rerender</button>;
}

// Controllable throw flag — set before render, clear to allow recovery after Reload
let throwEnabled = false;

function ControllableThrow() {
  if (throwEnabled) throw new Error("controlled error");
  return <div>Recovered</div>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ErrorBoundary — happy path (INV-2)", () => {
  it("renders children normally when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Normal content")).toBeTruthy();
    expect(screen.queryByText("This app encountered an error.")).toBeNull();
  });

  it("renders custom fallback prop when provided (not the default fallback)", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowOnRender shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom fallback")).toBeTruthy();
    expect(screen.queryByText("This app encountered an error.")).toBeNull();
  });
});

describe("ErrorBoundary — error catching (INV-1)", () => {
  it("shows fallback when child throws on first render", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("This app encountered an error.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reload/i })).toBeTruthy();
    // Original children must not be visible
    expect(screen.queryByText("Children rendered")).toBeNull();
  });

  it("shows fallback when child throws on re-render (not first render)", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRerender />
      </ErrorBoundary>,
    );
    // Initially renders fine
    expect(screen.getByText("Trigger rerender")).toBeTruthy();

    // Trigger a state update that causes the child to throw
    fireEvent.click(screen.getByText("Trigger rerender"));

    expect(screen.getByText("This app encountered an error.")).toBeTruthy();
    expect(screen.queryByText("Trigger rerender")).toBeNull();
  });

  it("logs error to console.error when catching", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender shouldThrow={true} />
      </ErrorBoundary>,
    );
    // Our spy should have been called (React calls it for error + componentStack)
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe("ErrorBoundary — reload (INV-3)", () => {
  beforeEach(() => {
    throwEnabled = false;
  });

  it("resets error state after clicking Reload, allowing children to re-render", () => {
    throwEnabled = true;
    render(
      <ErrorBoundary>
        <ControllableThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText("This app encountered an error.")).toBeTruthy();

    // Allow recovery before reload triggers re-render
    throwEnabled = false;
    fireEvent.click(screen.getByRole("button", { name: /Reload/i }));

    expect(screen.getByText("Recovered")).toBeTruthy();
    expect(screen.queryByText("This app encountered an error.")).toBeNull();
  });
});

describe("ErrorBoundary — isolation (multiple instances)", () => {
  it("two sibling boundaries are independent — one catching error does not affect the other", () => {
    render(
      <div>
        <ErrorBoundary>
          <ThrowOnRender shouldThrow={true} />
        </ErrorBoundary>
        <ErrorBoundary>
          <div>Sibling is fine</div>
        </ErrorBoundary>
      </div>,
    );

    // First boundary shows fallback
    expect(screen.getByText("This app encountered an error.")).toBeTruthy();
    // Second boundary renders normally
    expect(screen.getByText("Sibling is fine")).toBeTruthy();
  });
});
