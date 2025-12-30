import "@testing-library/jest-dom";

import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Select } from "./Select";

vi.mock("next/font/google", () => ({
  Montserrat: () => ({
    style: { fontFamily: "mocked" },
    className: "mocked-font",
    variable: "--font-mocked",
  }),
}));

vi.mock("../Popover/Popover", () => ({
  Popover: ({ trigger, content, isOpen }: any) => (
    <div>
      {trigger}
      {isOpen && <div data-testid="popover-content">{content}</div>}
    </div>
  ),
}));

describe("Select Component", () => {
  const options = [
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2" },
  ];

  it("should render with placeholder", () => {
    render(<Select options={options} placeholder="Select an option" />);
    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });

  it("should open options when clicked and update aria attributes", () => {
    const { container } = render(<Select id="my-select" options={options} />);

    const trigger = screen.getByRole("combobox");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");

    expect(trigger).not.toHaveAttribute("aria-controls");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", "my-select-listbox");
    expect(screen.getByTestId("popover-content")).toBeInTheDocument();

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should select an option", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Select options={options} onChange={handleChange} />,
    );

    const trigger = container.querySelector("button") as HTMLElement;
    fireEvent.click(trigger);

    const popoverContent = screen.getByTestId("popover-content");
    const option1 = within(popoverContent).getByText("Option 1");
    fireEvent.click(option1);

    expect(handleChange).toHaveBeenCalled();
  });

  it("should have required attribute on hidden input when required prop is true", () => {
    const { container } = render(
      <Select required name="test-select" options={options} />,
    );
    const input = container.querySelector('input[name="test-select"]');
    expect(input).toHaveAttribute("required");
    expect(input).toHaveAttribute("type", "hidden");
  });

  it("should handle keyboard navigation", () => {
    const handleChange = vi.fn();
    render(<Select options={options} onChange={handleChange} />);
    const trigger = screen.getByRole("combobox");

    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowUp" });

    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(handleChange).toHaveBeenCalled();
  });

  it("should close on Escape", () => {
    render(<Select options={options} />);
    const trigger = screen.getByRole("combobox");

    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should be disabled when prop is set", () => {
    render(<Select disabled options={options} />);
    const trigger = screen.getByRole("combobox");

    expect(trigger).toBeDisabled();
  });
});
