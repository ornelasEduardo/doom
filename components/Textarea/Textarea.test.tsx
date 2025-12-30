import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Textarea } from "./Textarea";

describe("Textarea Component", () => {
  it("should render with label", () => {
    render(<Textarea label="Comments" />);
    expect(screen.getByText("Comments")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render required attribute", () => {
    render(<Textarea required label="Required" />);
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("should handle changes", () => {
    const handleChange = vi.fn();
    render(<Textarea onChange={handleChange} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "New text" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("should render disabled attribute", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should display error message and set aria-invalid", () => {
    render(<Textarea error="Field is required" />);
    const textarea = screen.getByRole("textbox");
    expect(screen.getByText("Field is required")).toBeInTheDocument();
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("error"),
    );
  });

  it("should display helper text and link via aria-describedby", () => {
    render(<Textarea helperText="Optional info" />);
    const textarea = screen.getByRole("textbox");
    expect(screen.getByText("Optional info")).toBeInTheDocument();
    expect(textarea).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining("helper"),
    );
  });

  describe("Character Counter", () => {
    it("should show counter automatically when maxLength is present", () => {
      render(<Textarea defaultValue="Initial text" maxLength={100} />);
      expect(screen.getByText("12 / 100")).toBeInTheDocument();
    });

    it("should update counter on change", () => {
      render(<Textarea maxLength={100} />);
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Coding is fun" } });
      expect(screen.getByText("13 / 100")).toBeInTheDocument();
    });

    it("should show counter without maxLength if showCount is true", () => {
      render(<Textarea showCount defaultValue="Hello" />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should hide counter if showCount is false even with maxLength", () => {
      render(
        <Textarea defaultValue="Hello" maxLength={100} showCount={false} />,
      );
      expect(screen.queryByText(/5 \/ 100/)).not.toBeInTheDocument();
    });
  });
});
