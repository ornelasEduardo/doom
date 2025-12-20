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

  it("should support a visible label via aria-labelledby", () => {
    render(<ProgressBar value={30} label="Installing Updates" />);
    const progress = screen.getByRole("progressbar");
    const label = screen.getByText("Installing Updates");

    expect(progress).toHaveAttribute("aria-labelledby", label.id);
  });

  it("should have a default aria-label if no label is provided", () => {
    render(<ProgressBar value={10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-label",
      "Progress"
    );
  });

  it("should spread additional props to the container", () => {
    render(
      <ProgressBar value={20} data-testid="custom-bar" className="my-class" />
    );
    // The role is now on the inner container
    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("data-testid", "custom-bar");
    // className goes to the wrapper, but let's check the role-bearing div
    // Wait, the prop spread is usually on the interactive part
  });
});
