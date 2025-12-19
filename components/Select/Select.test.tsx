import "@testing-library/jest-dom";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Select } from "./Select";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock next/font/google
vi.mock("next/font/google", () => ({
  Montserrat: () => ({
    style: { fontFamily: "mocked" },
    className: "mocked-font",
    variable: "--font-mocked",
  }),
}));

// Mock Popover since it might be complex or rely on portals
// Mock Popover since it might be complex or rely on portals
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
    const { container } = render(<Select options={options} id="my-select" />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");

    // Check if aria-controls points to something valid (even if listbox isn't rendered yet or is hidden)
    const controlsId = trigger.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("popover-content")).toBeInTheDocument();

    // Check listbox role inside popover
    // Note: The mocked popover renders content directly.
    // In our implementation, Select renders a <ul> with role="listbox"
    // We need to ensure the mocked popover preserves that structure or we test what we can.
    // The Select component passes the <ul> into the Popover content prop.
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should select an option", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Select options={options} onChange={handleChange} />
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
      <Select options={options} required name="test-select" />
    );
    // Select the input that has the name "test-select"
    // Note: We changed type="hidden" to type="text" with opacity 0, so we query by name
    const input = container.querySelector('input[name="test-select"]');
    expect(input).toHaveAttribute("required");
    expect(input).toHaveAttribute("type", "hidden");
  });
});
