import "@testing-library/jest-dom";

import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Tooltip } from "./Tooltip";

describe("Tooltip Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children correctly", () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Trigger</button>
      </Tooltip>,
    );
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });

  it("shows tooltip on hover after delay", () => {
    render(
      <Tooltip content="Tooltip text" delay={200}>
        <button>Trigger</button>
      </Tooltip>,
    );

    // Initial state: hidden
    expect(screen.queryByText("Tooltip text")).not.toBeInTheDocument();

    // Mouse enter
    fireEvent.mouseEnter(screen.getByText("Trigger"));

    // Still hidden (delay)
    expect(screen.queryByText("Tooltip text")).not.toBeInTheDocument();

    // Advance time
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Visible
    expect(screen.getByText("Tooltip text")).toBeVisible();
  });

  it("hides tooltip on mouse leave", () => {
    render(
      <Tooltip content="Tooltip text" delay={0}>
        <button>Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("Trigger");

    // Show
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByText("Tooltip text")).toBeVisible();

    // Hide
    fireEvent.mouseLeave(trigger);
    expect(screen.queryByText("Tooltip text")).not.toBeInTheDocument();
  });
});
