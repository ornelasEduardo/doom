import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";
import { describe, it, expect } from "vitest";
import React from "react";

describe("ProgressBar Component", () => {
  it("should render with correct accessibility attributes", () => {
    render(<ProgressBar value={50} aria-label="Loading progress" />);
    const progress = screen.getByRole("progressbar");

    expect(progress).toBeInTheDocument();
    expect(progress).toHaveAttribute("aria-valuenow", "50");
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
    expect(progress).toHaveAttribute("aria-label", "Loading progress");
  });

  it("should clamp value between 0 and 100 in accessibility attributes", () => {
    const { rerender } = render(<ProgressBar value={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100"
    );

    rerender(<ProgressBar value={-50} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0"
    );
  });

  it("should support custom max value", () => {
    render(<ProgressBar value={50} max={200} />);
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuemax", "200");
    expect(progress).toHaveAttribute("aria-valuenow", "50");
  });

  it("should spread additional props to the container", () => {
    render(
      <ProgressBar value={20} data-testid="custom-bar" className="my-class" />
    );
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("data-testid", "custom-bar");
    expect(progress).toHaveClass("my-class");
  });
});
