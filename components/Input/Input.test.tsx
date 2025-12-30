import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Input } from "./Input";

describe("Input Component", () => {
  it("should render with label", () => {
    render(<Input label="Username" />);
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render required attribute", () => {
    render(<Input required label="Required" />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("should render disabled attribute", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should handle value changes", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("should display error message and set aria-invalid", () => {
    render(<Input error="Invalid input" />);
    const input = screen.getByRole("textbox");
    expect(screen.getByText("Invalid input")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("error"),
    );
  });

  it("should display helper text and link via aria-describedby", () => {
    render(<Input helperText="Enter your name" />);
    const input = screen.getByRole("textbox");
    expect(screen.getByText("Enter your name")).toBeInTheDocument();
    expect(input).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("helper"),
    );
  });

  it("should render adornments", () => {
    render(<Input endAdornment="kg" startAdornment="$" />);
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
  });

  it("should validate on blur", () => {
    const validate = vi.fn((val) => (val === "bad" ? "Error" : undefined));
    render(<Input validate={validate} />);

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "bad" } });
    fireEvent.blur(input);

    expect(validate).toHaveBeenCalledWith("bad");
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  describe("Character Counter", () => {
    it("should show counter automatically when maxLength is present", () => {
      render(<Input defaultValue="Hello" maxLength={20} />);
      expect(screen.getByText("5 / 20")).toBeInTheDocument();
    });

    it("should update counter on change", () => {
      render(<Input maxLength={20} />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "New value" } });
      expect(screen.getByText("9 / 20")).toBeInTheDocument();
    });

    it("should show counter without maxLength if showCount is true", () => {
      render(<Input showCount defaultValue="Hello" />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should hide counter if showCount is false even with maxLength", () => {
      render(<Input defaultValue="Hello" maxLength={20} showCount={false} />);
      expect(screen.queryByText(/5 \/ 20/)).not.toBeInTheDocument();
    });
  });

  it("should not render the bottom row when no helper text, error, or maxLength is provided", () => {
    const { container } = render(<Input />);
    // Import styles to use the class name
    const bottomRow = container.querySelector("[class*='bottomRow']");
    expect(bottomRow).not.toBeInTheDocument();
  });
});
