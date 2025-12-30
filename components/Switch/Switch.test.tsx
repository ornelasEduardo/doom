import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Switch } from "./Switch";

describe("Switch Component", () => {
  it("renders correctly", () => {
    render(<Switch label="Test Switch" />);
    expect(screen.getByLabelText("Test Switch")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("handles checked state", () => {
    render(<Switch readOnly checked={true} />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeChecked();
  });

  it("calls onChange when clicked", () => {
    const handleChange = vi.fn();
    render(<Switch onChange={handleChange} />);

    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("does not call onChange when disabled", () => {
    const handleChange = vi.fn();
    render(<Switch disabled onChange={handleChange} />);

    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);

    expect(handleChange).not.toHaveBeenCalled();
    expect(switchElement).toBeDisabled();
  });
});
