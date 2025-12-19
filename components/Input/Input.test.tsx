import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./Input";
import { describe, it, expect, vi } from "vitest";
import React from "react";

describe("Input Component", () => {
  it("should render with label", () => {
    render(<Input label="Username" />);
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render required attribute", () => {
    render(<Input label="Required" required />);
    expect(screen.getByRole("textbox")).toBeRequired();
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
      expect.stringContaining("error")
    );
  });

  it("should display helper text and link via aria-describedby", () => {
    render(<Input helperText="Enter your name" />);
    const input = screen.getByRole("textbox");
    expect(screen.getByText("Enter your name")).toBeInTheDocument();
    expect(input).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("helper")
    );
  });

  it("should render adornments", () => {
    render(<Input startAdornment="$" endAdornment="kg" />);
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
});
