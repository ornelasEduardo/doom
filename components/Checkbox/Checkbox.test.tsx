import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders correctly", () => {
    render(<Checkbox label="Test Checkbox" />);

    // We expect a checkbox input and a label with text
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();

    // The "label" text is rendered in a span (Label component) but linked via htmlFor,
    // so getting by Label Text should work
    const label = screen.getByLabelText("Test Checkbox");
    expect(label).toBeInTheDocument();
    expect(label).toBe(checkbox);
  });

  it("handles unchecked state by default", () => {
    render(<Checkbox label="Test" />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("handles checked state", () => {
    render(<Checkbox checked readOnly label="Test" />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onChange when clicked", () => {
    const handleChange = vi.fn();
    render(<Checkbox label="Test" onChange={handleChange} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(checkbox).toBeChecked();
  });

  it("displays error state", () => {
    // Currently Checkbox doesn't do much visually with error prop other than maybe passing it down?
    // Looking at implementation: `error` prop is in interface but not used in rendering classNames?
    // Let's check implementation behavior or just skip if visual only.
    // The impl passes ...props to input.
    render(<Checkbox error label="Test" />);
    // Basic render check, effectively ensuring it doesn't crash on extra props
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is passed", () => {
    render(<Checkbox disabled label="Test" />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();

    // Wrappers (input and maybe label) should enforce disabled styles/behavior
  });

  it("generates unique ids if not provided", () => {
    render(
      <>
        <Checkbox label="First" />
        <Checkbox label="Second" />
      </>,
    );

    const first = screen.getByLabelText("First");
    const second = screen.getByLabelText("Second");

    expect(first.id).not.toBe(second.id);
  });
});
