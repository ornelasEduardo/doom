import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Chip } from "./Chip";

describe("Chip", () => {
  // ==========================================================================
  // Rendering
  // ==========================================================================

  it("should render children correctly", () => {
    render(<Chip>Test Label</Chip>);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("should apply default variant and size classes", () => {
    const { container } = render(<Chip>Default</Chip>);
    const chip = container.querySelector("span");
    expect(chip?.className).toMatch(/chip/);
    expect(chip?.className).toMatch(/default/);
    expect(chip?.className).toMatch(/md/);
  });

  it.each(["primary", "success", "warning", "error"] as const)(
    "should apply %s variant class",
    (variant) => {
      const { container } = render(<Chip variant={variant}>Variant</Chip>);
      const chip = container.querySelector("span");
      expect(chip?.className).toMatch(new RegExp(variant));
    },
  );

  it.each(["xs", "sm", "md", "lg", "xl"] as const)(
    "should apply %s size class",
    (size) => {
      const { container } = render(<Chip size={size}>Size</Chip>);
      const chip = container.querySelector("span");
      expect(chip?.className).toMatch(new RegExp(`_${size}_`));
    },
  );

  // ==========================================================================
  // Interactivity
  // ==========================================================================

  it("should apply interactive class when onClick is provided", () => {
    const { container } = render(<Chip onClick={() => {}}>Clickable</Chip>);
    const chip = container.querySelector("span");
    expect(chip?.className).toMatch(/interactive/);
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Chip onClick={handleClick}>Clickable</Chip>);

    fireEvent.click(screen.getByText("Clickable"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Chip disabled onClick={handleClick}>
        Disabled
      </Chip>,
    );

    fireEvent.click(screen.getByText("Disabled"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should have role=button when onClick is provided", () => {
    render(<Chip onClick={() => {}}>Button</Chip>);
    const chip = screen.getByRole("button");
    expect(chip).toBeInTheDocument();
  });

  it("should have tabIndex=0 when interactive and not disabled", () => {
    const { container } = render(<Chip onClick={() => {}}>Focusable</Chip>);
    const chip = container.querySelector("span");
    expect(chip).toHaveAttribute("tabIndex", "0");
  });

  it("should not have tabIndex when disabled", () => {
    const { container } = render(
      <Chip disabled onClick={() => {}}>
        Disabled
      </Chip>,
    );
    const chip = container.querySelector("span");
    expect(chip).not.toHaveAttribute("tabIndex");
  });

  // ==========================================================================
  // Dismiss
  // ==========================================================================

  it("should render dismiss button when onDismiss is provided", () => {
    render(<Chip onDismiss={() => {}}>Dismissible</Chip>);
    expect(screen.getByLabelText("Dismiss")).toBeInTheDocument();
  });

  it("should not render dismiss button when disabled", () => {
    render(
      <Chip disabled onDismiss={() => {}}>
        Disabled Dismiss
      </Chip>,
    );
    expect(screen.queryByLabelText("Dismiss")).not.toBeInTheDocument();
  });

  it("should call onDismiss when dismiss button clicked", () => {
    const handleDismiss = vi.fn();
    render(<Chip onDismiss={handleDismiss}>Dismissible</Chip>);

    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("should stop propagation on dismiss click", () => {
    const handleDismiss = vi.fn();
    const handleClick = vi.fn();
    render(
      <Chip onClick={handleClick} onDismiss={handleDismiss}>
        Both
      </Chip>,
    );

    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // Ref Forwarding
  // ==========================================================================

  it("should forward ref to the span element", () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Chip ref={ref}>Ref Test</Chip>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current?.textContent).toContain("Ref Test");
  });

  // ==========================================================================
  // Disabled State
  // ==========================================================================

  it("should apply disabled class when disabled", () => {
    const { container } = render(<Chip disabled>Disabled</Chip>);
    const chip = container.querySelector("span");
    expect(chip?.className).toMatch(/disabled/);
  });

  // ==========================================================================
  // Keyboard Accessibility
  // ==========================================================================

  it("should trigger onClick when Enter key is pressed", () => {
    const handleClick = vi.fn();
    render(<Chip onClick={handleClick}>Clickable</Chip>);
    const chip = screen.getByText("Clickable").closest("span");

    if (chip) {
      fireEvent.keyDown(chip, { key: "Enter", code: "Enter" });
    }
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should trigger onClick when Space key is pressed", () => {
    const handleClick = vi.fn();
    render(<Chip onClick={handleClick}>Clickable</Chip>);
    const chip = screen.getByText("Clickable").closest("span");

    if (chip) {
      fireEvent.keyDown(chip, { key: " ", code: "Space" });
    }
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
